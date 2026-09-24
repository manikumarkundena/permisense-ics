from app.models.telemetry_event import TelemetryEvent


def evaluate_process_impact(
    process_events: list[TelemetryEvent],
) -> dict | None:

    for event in process_events:

        if (
            event.register_address == 30001
            and event.value is not None
            and event.value > 80
        ):
            return {
                "impact_type": "process_degradation",
                "title": "Conveyor overspeed",
                "description": (
                    "The conveyor actual speed exceeded the "
                    "configured safe operating threshold."
                ),
                "evidence": {
                    "register_address": event.register_address,
                    "value": event.value,
                    "unit": event.unit,
                    "threshold": 80,
                },
            }

        if (
            event.register_address == 30003
            and event.value is not None
            and event.value > 80
        ):
            return {
                "impact_type": "high_motor_load",
                "title": "High motor load",
                "description": (
                    "Motor load exceeded the configured "
                    "operating threshold."
                ),
                "evidence": {
                    "register_address": event.register_address,
                    "value": event.value,
                    "unit": event.unit,
                    "threshold": 80,
                },
            }

        if (
            event.register_address == 30006
            and event.value == 1
        ):
            return {
                "impact_type": "process_jam",
                "title": "Process jam detected",
                "description": (
                    "The manufacturing process reported "
                    "a jam condition."
                ),
                "evidence": {
                    "register_address": event.register_address,
                    "value": event.value,
                },
            }

    return None
