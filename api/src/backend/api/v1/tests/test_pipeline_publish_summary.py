from api.v1.pipeline_publish_views import _extract_summary


def test_extract_summary_includes_pipeline_metrics():
    payload = {
        "baseline_fail_count": 10,
        "threat_score": 91.2,
        "threat_score_delta": -2.5,
        "findings_status": {
            "fail": 5,
            "pass": 5,
            "fail_new": 1,
            "pass_new": 2,
        },
        "severity": {
            "critical": 1,
            "high": 2,
            "medium": 3,
            "low": 4,
            "informational": 0,
        },
        "resource_inventory": [
            {
                "id": "storage",
                "resources_count": 2,
                "total_findings": 4,
                "failed_findings": 3,
                "new_failed_findings": 1,
                "severity": {
                    "critical": 0,
                    "high": 1,
                    "medium": 1,
                    "low": 1,
                    "informational": 0,
                },
            }
        ],
    }

    summary = _extract_summary(payload)

    assert summary["baseline_fail"] == 10
    assert summary["threat_score"] == 91.2
    assert summary["threat_score_delta"] == -2.5
    assert summary["findings_status"]["fail"] == 5
    assert summary["severity"]["critical"] == 1
    assert summary["resource_inventory"][0]["id"] == "storage"
