from uuid import uuid4

from app.impact.rules import evaluate_process_impact
from app.impact.schemas import ProcessImpact
from app.models.telemetry_event import TelemetryEvent
from app.schemas.events import Severity


def evaluate_impact(
    asset_id: str,
    process_id: str | None,
    process_events: list[TelemetryEvent],
) -> ProcessImpact | None:

    result = evaluate_process_impact(
        process_events
    )

    if result is None:
        return None

    return ProcessImpact(
        impact_id=str(uuid4()),
        asset_id=asset_id,
        process_id=process_id,
        severity=Severity.HIGH,
        impact_type=result["impact_type"],
        title=result["title"],
        description=result["description"],
        evidence=result["evidence"],
    )
