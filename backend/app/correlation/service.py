from uuid import uuid4

from app.correlation.rules import correlate_control_to_process
from app.correlation.schemas import CorrelationResult
from app.models.telemetry_event import TelemetryEvent
from app.schemas.events import Severity


def evaluate_correlation(
    control_event: TelemetryEvent,
    process_events: list[TelemetryEvent],
) -> CorrelationResult | None:

    result = correlate_control_to_process(
        control_event,
        process_events,
    )

    if result is None:
        return None

    process_events = result["process_events"]

    event_ids = [
        control_event.event_id,
        *[event.event_id for event in process_events],
    ]

    return CorrelationResult(
        correlation_id=str(uuid4()),
        asset_id=control_event.asset_id,
        process_id=control_event.process_id,
        timestamp=process_events[-1].timestamp,
        severity=Severity.HIGH,
        title="Control manipulation followed by process deviation",
        reason=(
            "A control write was followed by abnormal process "
            "telemetry on the same industrial asset within "
            f"30 seconds."
        ),
        event_ids=event_ids,
        detection_ids=[],
        evidence={
            "control_register": control_event.register_address,
            "control_value": control_event.value,
            "process_events": [
                {
                    "event_id": event.event_id,
                    "register_address": event.register_address,
                    "value": event.value,
                    "unit": event.unit,
                }
                for event in process_events
            ],
            "window_seconds": 30,
        },
    )
