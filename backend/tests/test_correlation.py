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
    )

    assert result is not None
    assert result.asset_id == "PLC-01"
    assert result.process_id == "manufacturing-cell-01"
    assert result.severity.value == "high"

    assert result.event_ids == [
        "evt-control-001",
        "evt-process-001",
    ]


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
