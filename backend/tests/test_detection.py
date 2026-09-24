from datetime import datetime, timezone

from app.detection.service import evaluate_event
from app.schemas.events import (
    EventSource,
    EventType,
    PermiSenseEvent,
)


def make_event(**kwargs):
    data = {
        "event_id": "evt-detection-test",
        "timestamp": datetime.now(timezone.utc),
        "source": EventSource.MODBUS,
        "event_type": EventType.SENSOR_UPDATE,
        "asset_id": "PLC-01",
        "asset_type": "plc",
        "protocol": "modbus_tcp",
        "process_id": "manufacturing-cell-01",
        "metadata": {},
    }

    data.update(kwargs)

    return PermiSenseEvent(**data)


def test_control_write_detected():
    event = make_event(
        event_type=EventType.CONTROL_WRITE,
        register_address=40003,
        previous_value=50.0,
        value=90.0,
    )

    results = evaluate_event(event)

    assert len(results) == 1
    assert results[0].rule_id == "ICS-CONTROL-WRITE"
    assert results[0].severity.value == "high"


def test_overspeed_detected():
    event = make_event(
        register_address=30001,
        value=90.0,
        unit="percent",
    )

    results = evaluate_event(event)

    assert len(results) == 1
    assert results[0].rule_id == "PROCESS-OVERSPEED"


def test_high_load_detected():
    event = make_event(
        register_address=30003,
        value=90.0,
        unit="percent",
    )

    results = evaluate_event(event)

    assert len(results) == 1
    assert results[0].rule_id == "PROCESS-HIGH-LOAD"


def test_jam_detected():
    event = make_event(
        register_address=30006,
        value=1,
    )

    results = evaluate_event(event)

    assert len(results) == 1
    assert results[0].rule_id == "PROCESS-JAM"


def test_normal_speed_not_detected():
    event = make_event(
        register_address=30001,
        value=50.0,
        unit="percent",
    )

    results = evaluate_event(event)

    assert results == []
