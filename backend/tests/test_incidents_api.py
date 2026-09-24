from datetime import datetime, timezone

from app.api.incidents import _incident


def test_incident_projection_contains_security_context():
    correlation = type(
        "CorrelationStub",
        (),
        {
            "correlation_id": "corr-001",
            "asset_id": "PLC-01",
            "process_id": "manufacturing-cell-01",
            "timestamp": datetime.now(timezone.utc),
            "severity": "high",
            "title": "Conveyor overspeed",
            "reason": "Control write followed by abnormal process telemetry.",
            "event_ids_json": ["evt-control", "evt-process"],
            "detection_ids_json": ["det-001"],
            "evidence_json": {
                "incident": {"status": "investigating"},
                "detections": [{"rule_id": "PROCESS-OVERSPEED"}],
                "mitre_mappings": [{"technique_id": "T0831"}],
                "impact": {"impact_type": "process_degradation"},
                "risk": {"level": "critical", "score": 100},
                "evidence_graph": {"nodes": [], "edges": []},
                "response": {"approved": False},
            },
        },
    )()

    result = _incident(correlation)

    assert result["incident_id"] == "corr-001"
    assert result["status"] == "investigating"
    assert result["detections"][0]["rule_id"] == "PROCESS-OVERSPEED"
    assert result["mitre_mappings"][0]["technique_id"] == "T0831"
    assert result["risk"]["level"] == "critical"
    assert result["response"]["approved"] is False
