from sqlalchemy.ext.asyncio import AsyncSession

from app.models.telemetry_event import TelemetryEvent
from app.schemas.events import PermiSenseEvent


async def save_event(
    session: AsyncSession,
    event: PermiSenseEvent,
) -> TelemetryEvent:
    db_event = TelemetryEvent(
        event_id=event.event_id,
        timestamp=event.timestamp,
        source=event.source.value,
        event_type=event.event_type.value,
        asset_id=event.asset_id,
        asset_type=event.asset_type,
        source_address=event.source_address,
        destination_address=event.destination_address,
        protocol=event.protocol,
        command=event.command,
        register_address=event.register_address,
        previous_value=(
            float(event.previous_value)
            if event.previous_value is not None
            else None
        ),
        value=float(event.value) if event.value is not None else None,
        unit=event.unit,
        process_id=event.process_id,
        severity=event.severity.value,
        metadata_json=event.metadata,
    )

    session.add(db_event)
    await session.commit()
    await session.refresh(db_event)

    return db_event