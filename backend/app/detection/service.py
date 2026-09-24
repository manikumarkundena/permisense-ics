from uuid import uuid4

from app.detection.rules import detect_event
from app.detection.schemas import DetectionResult
from app.schemas.events import PermiSenseEvent


def evaluate_event(event: PermiSenseEvent) -> list[DetectionResult]:
    """Evaluate one canonical event against deterministic rules."""

    matches = detect_event(event)

    return [
        DetectionResult(
            detection_id=str(uuid4()),
            event_id=event.event_id,
            rule_id=match["rule_id"],
            timestamp=event.timestamp,
            asset_id=event.asset_id,
            severity=match["severity"],
            title=match["title"],
            reason=match["reason"],
            evidence=match["evidence"],
        )
        for match in matches
    ]
