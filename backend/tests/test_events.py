from app.schemas.events import (
    EventSource,
    EventType,
    PermiSenseEvent,
)


def test_modbus_event_contract():
    event = PermiSenseEvent(
        event_id="evt-test-001",
        source=EventSource.MODBUS,
        event_type=EventType.CONTROL_WRITE,
        asset_id="PLC-01",
        asset_type="plc",
        protocol="modbus_tcp",
        command="write_register",
        register_address=40102,
        previous_value=40,
        value=85,
    )

    assert event.event_id == "evt-test-001"
    assert event.source == EventSource.MODBUS
    assert event.event_type == EventType.CONTROL_WRITE
    assert event.value == 85
