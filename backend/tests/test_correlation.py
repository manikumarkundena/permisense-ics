from datetime import datetime, timedelta, timezone

from app.correlation.service import evaluate_correlation
from app.models.telemetry_event import TelemetryEvent


def make_event(
    event_id: str,
    timestamp: datetime,
    event_type: str,
    register_address: int,
    value: float,
):
    return TelemetryEvent(
        event_id=event_id,
        timestamp=timestamp,
        source="modbus",
        event_type=event_type,
        asset_id="PLC-01",
        asset_type="plc",
        protocol="modbus_tcp",
        command="write_register",
        register_address=register_address,
        value=value,
        process_id="manufacturing-cell-01",
        severity="info",
        metadata_json={},
    )


def test_control_write_correlates_with_process_deviation():
    start = datetime.now(timezone.utc)

    control_event = make_event(
        "evt-control-001",
        start,
        "control_write",
        40003,
        900,
    )

    process_event = make_event(
        "evt-process-001",
        start + timedelta(seconds=5),
        "sensor_update",
        30001,
        85,
    )

    result = evaluate_correlation(
        control_event,
        [process_event],
        detection_ids=["det-control-001", "det-process-001"],
        detection_details=[
            {
                "detection_id": "det-control-001",
                "event_id": "evt-control-001",
                "rule_id": "ICS-CONTROL-WRITE",
                "severity": "high",
                "title": "Industrial control write observed",
                "reason": "A control value was written.",
                "evidence": {},
            },
            {
                "detection_id": "det-process-001",
                "event_id": "evt-process-001",
                "rule_id": "PROCESS-OVERSPEED",
                "severity": "high",
                "title": "Conveyor overspeed detected",
                "reason": "Actual speed exceeded the threshold.",
                "evidence": {},
            },
        ],
    )

    assert result is not None
    assert result.asset_id == "PLC-01"
    assert result.process_id == "manufacturing-cell-01"
    assert result.severity.value == "high"

    assert result.event_ids == [
        "evt-control-001",
        "evt-process-001",
    ]

    assert result.mitre_mappings
    assert result.mitre_mappings[0]["technique_id"] == "T1692.001"
    assert any(
        mapping["technique_id"] == "T0831"
        for mapping in result.mitre_mappings
    )

    assert result.impact is not None
    assert result.impact["impact_type"] == "process_degradation"
    assert result.impact["title"] == "Conveyor overspeed"

    assert result.risk is not None
    assert result.risk["level"] == "high"
    assert result.risk["score"] == 82
    assert {factor["name"] for factor in result.risk["factors"]} == {
        "severity_base",
        "control_manipulation",
        "process_impact",
        "deviation_magnitude",
        "temporal_correlation",
    }

    assert result.evidence["correlation"]["time_delta_ms"] == 5000.0

    graph = result.evidence_graph
    assert graph is not None
    node_ids = {node["id"] for node in graph["nodes"]}
    assert "evt-control-001" in node_ids
    assert "evt-process-001" in node_ids
    assert "det-control-001" in node_ids
    assert "det-process-001" in node_ids
    assert "mitre:T1692.001" in node_ids
    assert result.impact["impact_id"] in node_ids
    assert result.risk["risk_id"] in node_ids

    detection_nodes = {
        node["id"]: node
        for node in graph["nodes"]
        if node["type"] == "detection"
    }
    assert (
        detection_nodes["det-control-001"]["label"]
        == "ICS-CONTROL-WRITE: Industrial control write observed"
    )
    assert (
        detection_nodes["det-process-001"]["label"]
        == "PROCESS-OVERSPEED: Conveyor overspeed detected"
    )


def test_unrelated_asset_does_not_correlate():
    start = datetime.now(timezone.utc)

    control_event = make_event(
        "evt-control-002",
        start,
        "control_write",
        40003,
        900,
    )

    process_event = make_event(
        "evt-process-002",
        start + timedelta(seconds=5),
        "sensor_update",
        30001,
        85,
    )

    process_event.asset_id = "PLC-02"

    result = evaluate_correlation(
        control_event,
        [process_event],
    )

    assert result is None


def test_operating_mode_change_correlates_with_process_stop():
    start = datetime.now(timezone.utc)

    control_event = make_event(
        "evt-control-mode-001",
        start,
        "control_write",
        40002,
        0,
    )
    control_event.previous_value = 1

    process_event = make_event(
        "evt-process-stop-001",
        start + timedelta(seconds=3),
        "sensor_update",
        30007,
        0,
    )

    result = evaluate_correlation(
        control_event,
        [process_event],
    )

    assert result is not None
    assert result.impact is not None
    assert result.impact["impact_type"] == "process_stopped"
    assert "operating mode" in result.title.lower()
    assert result.evidence["correlation"]["time_delta_ms"] == 3000.0
    assert result.risk["score"] == 90
    assert result.risk["level"] == "critical"
    assert any(
        mapping["technique_id"] == "T0858"
        for mapping in result.mitre_mappings
    )
