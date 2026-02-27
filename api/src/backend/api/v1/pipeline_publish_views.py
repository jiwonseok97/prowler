from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from rest_framework import status
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


def _state_file() -> Path:
    path = os.getenv(
        "DJANGO_PIPELINE_PUBLISH_STATE_FILE",
        "/tmp/prowler_pipeline_publish_state.json",
    ).strip()
    return Path(path)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_state() -> dict[str, Any]:
    path = _state_file()
    if not path.exists():
        return {"latest": None, "events": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"latest": None, "events": {}}


def _write_state(state: dict[str, Any]) -> None:
    path = _state_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _extract_summary(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        return {}
    keys = [
        "baseline_fail",
        "post_fail",
        "reduced",
        "post_fail_remediable",
        "post_fail_manual_runbook",
        "threat_score",
        "threat_score_delta",
        "findings_status",
        "severity",
        "resource_inventory",
    ]
    result = {k: payload.get(k) for k in keys if k in payload}
    # write_scan_manifest.py uses "baseline_fail_count" — map to canonical key
    if "baseline_fail" not in result and "baseline_fail_count" in payload:
        result["baseline_fail"] = payload["baseline_fail_count"]
    return result


def _required_token() -> str:
    return os.getenv("DJANGO_PIPELINE_PUBLISH_TOKEN", "").strip()


def _authorized(request) -> bool:
    required = _required_token()
    if not required:
        return True
    auth_header = str(request.headers.get("Authorization", ""))
    if not auth_header.startswith("Bearer "):
        return False
    provided = auth_header.split(" ", 1)[1].strip()
    return provided == required


class PipelinePublishEventAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    renderer_classes = [JSONRenderer]

    def post(self, request):
        if not _authorized(request):
            return Response(
                {"detail": "Unauthorized pipeline publish token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        body = request.data if isinstance(request.data, dict) else {}
        meta = body.get("meta") if isinstance(body.get("meta"), dict) else {}
        payload = body.get("payload")

        entry = {
            "received_at": _utc_now_iso(),
            "meta": {
                "event": str(meta.get("event", "")),
                "repo": str(meta.get("repo", "")),
                "run_id": str(meta.get("run_id", "")),
                "account_id": str(meta.get("account_id", "")),
                "region": str(meta.get("region", "")),
                "framework": str(meta.get("framework", "")),
                "source_file": str(meta.get("source_file", "")),
                "published_at_epoch": meta.get("published_at_epoch"),
            },
            "summary": _extract_summary(payload),
        }

        state = _read_state()
        events = state.get("events") if isinstance(state.get("events"), dict) else {}
        event_name = entry["meta"]["event"] or "unknown"
        events[event_name] = entry
        state["events"] = events
        state["latest"] = entry
        _write_state(state)

        return Response(
            {"ok": True, "latest_upload": entry},
            status=status.HTTP_200_OK,
        )


class PipelinePublishLatestAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    renderer_classes = [JSONRenderer]

    def get(self, request):
        state = _read_state()
        latest = state.get("latest")
        return Response(
            {
                "latest_upload": latest,
                "events": state.get("events", {}),
            },
            status=status.HTTP_200_OK,
        )


class PipelinePublishScanOutputAPIView(APIView):
    """Accept a scan report ZIP from GitHub Actions and make it available for download.

    Expects multipart/form-data with:
      - scan_id  (str) : the Prowler scan UUID
      - report_zip     : the ZIP file to serve via GET /scans/{id}/report
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser]
    renderer_classes = [JSONRenderer]

    def post(self, request):
        if not _authorized(request):
            return Response(
                {"detail": "Unauthorized pipeline publish token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        scan_id = (request.data.get("scan_id") or "").strip()
        if not scan_id:
            return Response(
                {"detail": "scan_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        zip_file = request.FILES.get("report_zip")
        if not zip_file:
            return Response(
                {"detail": "report_zip file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        output_root = os.getenv("DJANGO_TMP_OUTPUT_DIRECTORY", "/tmp/prowler_api_output")
        pipeline_dir = Path(output_root) / "pipeline_scans"
        try:
            pipeline_dir.mkdir(parents=True, exist_ok=True)
            zip_path = pipeline_dir / f"{scan_id}.zip"
            zip_path.write_bytes(zip_file.read())
        except Exception as exc:
            logger.error("pipeline scan-output: failed to save zip scan_id=%s error=%s", scan_id, exc)
            return Response(
                {"detail": f"Failed to save report: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Update the Scan record state and output_location
        try:
            from api.models import Scan, StateChoices  # noqa: PLC0415

            updated = Scan.all_objects.filter(id=scan_id).update(
                state=StateChoices.COMPLETED,
                output_location=str(zip_path),
            )
            logger.info(
                "pipeline scan-output: scan_id=%s updated=%s output=%s",
                scan_id,
                updated,
                zip_path,
            )
        except Exception as exc:
            logger.error("pipeline scan-output: DB update failed scan_id=%s error=%s", scan_id, exc)
            # File is saved; return partial success so workflow doesn't fail
            return Response(
                {"ok": True, "output_location": str(zip_path), "db_error": str(exc)},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"ok": True, "output_location": str(zip_path)},
            status=status.HTTP_200_OK,
        )
