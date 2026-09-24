from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.correlation.schemas import CorrelationResult
from app.models.correlation import Correlation
from app.models.telemetry_event import TelemetryEvent
from app.models.detection import Detection


async def save_correlation(
    session: AsyncSession,
    result: CorrelationResult,
) -> Correlation:

    correlation = Correlation(
        correlation_id=result.correlation_id,
        control_event_id=result.event_ids[0],
        timestamp=result.timestamp,
        asset_id=result.asset_id,
        process_id=result.process_id,
        severity=result.severity.value,
        title=result.title,
        reason=result.reason,
        event_ids_json=result.event_ids,
        detection_ids_json=result.detection_ids,
        evidence_json=result.evidence,
    )

    session.add(correlation)

    await session.commit()
    await session.refresh(correlation)

    return correlation


async def find_recent_control_events(
    session: AsyncSession,
    process_event: TelemetryEvent,
    window_seconds: int = 30,
) -> list[TelemetryEvent]:

    window_start = process_event.timestamp - timedelta(
        seconds=window_seconds
    )

    result = await session.execute(
        select(TelemetryEvent)
        .where(
            TelemetryEvent.asset_id == process_event.asset_id,
            TelemetryEvent.process_id == process_event.process_id,
            TelemetryEvent.event_type == "control_write",
            TelemetryEvent.timestamp <= process_event.timestamp,
            TelemetryEvent.timestamp >= window_start,
        )
        .order_by(TelemetryEvent.timestamp.asc())
    )

    return list(result.scalars().all())


async def get_detection_ids_for_events(
    session: AsyncSession,
    event_ids: list[str],
) -> list[str]:

    if not event_ids:
        return []

    result = await session.execute(
        select(Detection.detection_id)
        .where(
            Detection.event_id.in_(event_ids)
        )
    )

    return list(result.scalars().all())


async def correlation_already_exists(
    session: AsyncSession,
    control_event_id: str,
) -> bool:

    result = await session.execute(
        select(Correlation.correlation_id)
        .where(
            Correlation.control_event_id == control_event_id
        )
        .limit(1)
    )

    return result.scalar_one_or_none() is not None