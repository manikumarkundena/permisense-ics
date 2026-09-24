import pytest
from sqlalchemy import delete, select

from app.core.database import AsyncSessionLocal
from app.models.telemetry_event import TelemetryEvent
from app.schemas.events import (
    EventSource,
    EventType,
    PermiSenseEvent,
)
from app.telemetry.repository import save_event

@pytest.mark.asyncio
async def test_save_event():
    event = PermiSenseEvent(
        event_id="evt-db-test-001",
        source=EventSource.MODBUS,
        event_type=EventType.CONTROL_WRITE,
        asset_id="PLC-01",
        asset_type="plc",
        protocol="modbus_tcp",
        command="write_register",
        register_address=40102,
        previous_value=40,
        value=85,
        unit=None,
        process_id="process-01",
        metadata={"test": True},
    )

    async with AsyncSessionLocal() as session:
        await session.execute(
            delete(TelemetryEvent).where(
                TelemetryEvent.event_id == event.event_id
            )
        )
        await session.commit()

        saved = await save_event(session, event)

        assert saved.event_id == event.event_id
        assert saved.asset_id == "PLC-01"
        assert saved.protocol == "modbus_tcp"
        assert saved.command == "write_register"
        assert saved.register_address == 40102
        assert saved.previous_value == 40
        assert saved.value == 85

        result = await session.execute(
            select(TelemetryEvent).where(
                TelemetryEvent.event_id == event.event_id
            )
        )

        stored = result.scalar_one()

        assert stored.event_id == event.event_id
        assert stored.metadata_json == {"test": True}

        await session.delete(stored)
        await session.commit()