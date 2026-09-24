from datetime import datetime, timezone

from app.impact.service import evaluate_impact
from app.models.telemetry_event import TelemetryEvent


def test_overspeed_process_impact():

    event = TelemetryEvent(
        event_id="evt-impact-001",
        timestamp=datetime.now(timezone.utc),
        source="modbus",
        event_type="sensor_update",
        asset_id="PLC-01",
        asset_type="plc",
        protocol="modbus_tcp",
        command="read_input_registers",
        register_address=30001,
        value=85,
        unit="percent",
        process_id="manufacturing-cell-01",
        severity="high",
        metadata_json={},
    )

    impact = evaluate_impact(
        asset_id="PLC-01",
        process_id="manufacturing-cell-01",
        process_events=[event],
    )

    assert impact is not None
    assert impact.impact_type == "process_degradation"
    assert impact.title == "Conveyor overspeed"
    assert impact.evidence["value"] == 85
