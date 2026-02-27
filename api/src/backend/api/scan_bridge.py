"""Optional bridge from Prowler scan creation to external pipeline trigger."""

from __future__ import annotations

import json
import logging
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from api.models import Scan


logger = logging.getLogger(__name__)


def _enabled() -> bool:
    return os.getenv("DJANGO_SCAN_BRIDGE_ENABLED", "false").strip().lower() == "true"


def _bool_env(name: str, default: bool) -> bool:
    v = os.getenv(name, "").strip().lower()
    if not v:
        return default
    return v in {"1", "true", "yes", "y", "on"}


def _resolve_account_id(scan: Scan) -> str:
    source = os.getenv("DJANGO_SCAN_BRIDGE_ACCOUNT_ID_SOURCE", "provider_uid").strip()
    if source == "env":
        return os.getenv("DJANGO_SCAN_BRIDGE_ACCOUNT_ID", "").strip()
    provider_uid = getattr(scan.provider, "uid", "") if scan.provider else ""
    return str(provider_uid).strip()


def _build_payload(scan: Scan, tenant_id: str) -> dict[str, Any]:
    return {
        "account_id": _resolve_account_id(scan),
        "region": os.getenv("DJANGO_SCAN_BRIDGE_REGION", "ap-northeast-2").strip(),
        "deploy_vulnerable": True,
        "ref": os.getenv("DJANGO_SCAN_BRIDGE_REF", "main").strip(),
        "scan_context": {
            "scan_id": str(scan.id),
            "tenant_id": str(tenant_id),
            "provider_id": str(scan.provider_id),
            "provider_uid": str(getattr(scan.provider, "uid", "")),
            "provider_alias": str(getattr(scan.provider, "alias", "")),
            "scan_name": str(scan.name or ""),
        },
    }


def _github_dispatch_payload(scan: Scan, tenant_id: str) -> dict[str, Any]:
    payload = _build_payload(scan, tenant_id)
    compliance_mode = os.getenv(
        "DJANGO_SCAN_BRIDGE_COMPLIANCE_MODE", "cis_1.4_plus_isms_p"
    ).strip()
    return {
        "ref": payload.get("ref", "main"),
        "inputs": {
            "deploy_vulnerable": "true" if payload.get("deploy_vulnerable") else "false",
            "account_id": payload.get("account_id", ""),
            "compliance_mode": compliance_mode,
        },
    }


def trigger_external_scan_bridge(scan: Scan, tenant_id: str) -> None:
    """Best-effort trigger. Never raises to caller."""
    if not _enabled():
        return

    mode = os.getenv("DJANGO_SCAN_BRIDGE_MODE", "bridge").strip().lower()
    bridge_url = os.getenv("DJANGO_SCAN_BRIDGE_URL", "").strip()
    if mode == "github_dispatch":
        gh_repo = os.getenv("DJANGO_SCAN_BRIDGE_GH_REPO", "").strip()
        gh_workflow = os.getenv("DJANGO_SCAN_BRIDGE_GH_WORKFLOW", "scan-cis.yml").strip()
        if not gh_repo:
            logger.warning(
                "scan bridge github_dispatch mode but DJANGO_SCAN_BRIDGE_GH_REPO is empty"
            )
            return
        bridge_url = f"https://api.github.com/repos/{gh_repo}/actions/workflows/{gh_workflow}/dispatches"
    elif not bridge_url:
        logger.warning("scan bridge enabled but DJANGO_SCAN_BRIDGE_URL is empty")
        return

    payload = _build_payload(scan, tenant_id)
    if not payload.get("account_id"):
        logger.warning(
            "scan bridge skipped: account_id empty for scan_id=%s provider_uid=%s",
            scan.id,
            payload.get("scan_context", {}).get("provider_uid"),
        )
        return

    token = os.getenv("DJANGO_SCAN_BRIDGE_TOKEN", "").strip()
    timeout_sec = int(os.getenv("DJANGO_SCAN_BRIDGE_TIMEOUT_SEC", "20"))
    headers = {"Content-Type": "application/json", "User-Agent": "prowler-scan-bridge"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = payload
    if mode == "github_dispatch":
        body = _github_dispatch_payload(scan, tenant_id)
        headers["Accept"] = "application/vnd.github+json"
        headers["X-GitHub-Api-Version"] = "2022-11-28"

    data = json.dumps(body).encode("utf-8")

    def _do_post(url: str) -> None:
        req = Request(url=url, data=data, method="POST", headers=headers)
        try:
            with urlopen(req, timeout=timeout_sec) as resp:
                logger.info(
                    "scan bridge triggered: scan_id=%s status=%s url=%s",
                    scan.id,
                    resp.status,
                    url,
                )
        except HTTPError as exc:
            # Follow POST redirects (307/308/301/302) that urllib won't follow automatically
            if exc.code in (301, 302, 307, 308):
                raw = exc.read().decode("utf-8", errors="ignore")
                redirect_url = exc.headers.get("Location") or ""
                if not redirect_url:
                    try:
                        redirect_url = json.loads(raw).get("url", "")
                    except Exception:
                        pass
                if redirect_url:
                    logger.info(
                        "scan bridge following redirect %s → %s scan_id=%s",
                        exc.code,
                        redirect_url,
                        scan.id,
                    )
                    try:
                        req2 = Request(url=redirect_url, data=data, method="POST", headers=headers)
                        with urlopen(req2, timeout=timeout_sec) as resp2:
                            logger.info(
                                "scan bridge triggered (after redirect): scan_id=%s status=%s url=%s",
                                scan.id,
                                resp2.status,
                                redirect_url,
                            )
                    except Exception as exc2:
                        logger.warning(
                            "scan bridge redirect follow error: scan_id=%s error=%s",
                            scan.id,
                            exc2,
                        )
                    return
            detail = exc.read().decode("utf-8", errors="ignore") if exc.code not in (301, 302, 307, 308) else ""
            logger.warning(
                "scan bridge http error: scan_id=%s code=%s detail=%s",
                scan.id,
                exc.code,
                detail,
            )
        except URLError as exc:
            logger.warning("scan bridge url error: scan_id=%s error=%s", scan.id, exc)
        except Exception as exc:  # pragma: no cover
            logger.exception("scan bridge unexpected error: scan_id=%s error=%s", scan.id, exc)

    _do_post(bridge_url)
