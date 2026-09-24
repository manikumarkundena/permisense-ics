from sqlalchemy.ext.asyncio import AsyncSession

from app.detection.schemas import DetectionResult
from app.models.detection import Detection


async def save_detection(
    session: AsyncSession,
    result: DetectionResult,
) -> Detection:
    detection = Detection(
        detection_id=result.detection_id,
        event_id=result.event_id,
        timestamp=result.timestamp,
        asset_id=result.asset_id,
        rule_id=result.rule_id,
        severity=result.severity.value,
        title=result.title,
        reason=result.reason,
        evidence_json=result.evidence,
    )

    session.add(detection)
    await session.commit()
    await session.refresh(detection)

    return detection
