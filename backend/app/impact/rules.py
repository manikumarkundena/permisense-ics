from app.models.telemetry_event import TelemetryEvent


# Current virtual-cell safety thresholds. These are explicit prototype
# detection thresholds and must remain aligned with the PLC configuration
# used by the demo scenario.
OVERSPEED_THRESHOLD = 80.0
HIGH_LOAD_THRESHOLD = 80.0


def evaluate_process_impact(
    process_events: list[TelemetryEvent],
) -> dict | None:
    for event in process_events:
        if (
            event.register_address == 30001
            and event.value is not None
            and event.value > OVERSPEED_THRESHOLD
        ):
            return {
                "impact_type": "process_degradation",
                "title": "Conveyor overspeed",
                "description": (
                    "The conveyor actual speed exceeded the current "
                    "virtual-cell overspeed threshold."
                ),
                "evidence": {
                    "register_address": event.register_address,
                    "value": event.value,
                    "unit": event.unit,
                    "threshold": OVERSPEED_THRESHOLD,
                },
            }

        if (
            event.register_address == 30003
            and event.value is not None
            and event.value > HIGH_LOAD_THRESHOLD
        ):
            return {
                "impact_type": "high_motor_load",
                "title": "High motor load",
                "description": (
                    "Motor load exceeded the current virtual-cell "
                    "high-load threshold."
                ),
                "evidence": {
                    "register_address": event.register_address,
                    "value": event.value,
                    "unit": event.unit,
                    "threshold": HIGH_LOAD_THRESHOLD,
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
                    "The manufacturing process reported a jam condition."
                ),
                "evidence": {
                    "register_address": event.register_address,
                    "value": event.value,
                },
            }

    return None
