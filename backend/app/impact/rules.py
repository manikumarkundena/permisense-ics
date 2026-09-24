from app.models.telemetry_event import TelemetryEvent


OVERSPEED_THRESHOLD = 80.0
HIGH_LOAD_THRESHOLD = 80.0


def evaluate_process_impact(
    process_events: list[TelemetryEvent],
) -> dict | None:
    for event in process_events:
        if (
            event.register_address == 30001
            and event.value is not None
            and float(event.value) > OVERSPEED_THRESHOLD
        ):
            return {
                "impact_type": "process_degradation",
                "title": "Conveyor overspeed",
                "description": (
                    "The conveyor actual speed exceeded the virtual-cell "
                    "overspeed threshold."
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
            and float(event.value) > HIGH_LOAD_THRESHOLD
        ):
            return {
                "impact_type": "high_motor_load",
                "title": "High motor load",
                "description": (
                    "Motor load exceeded the virtual-cell high-load threshold."
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
            and event.value is not None
            and int(event.value) == 1
        ):
            return {
                "impact_type": "process_jam",
                "title": "Process jam detected",
                "description": "The manufacturing process reported a jam condition.",
                "evidence": {
                    "register_address": event.register_address,
                    "value": event.value,
                },
            }

        if (
            event.register_address == 30007
            and event.value is not None
            and int(event.value) == 0
        ):
            return {
                "impact_type": "process_stopped",
                "title": "Manufacturing process stopped",
                "description": (
                    "The PLC process state changed to STOPPED after a control "
                    "change on the same asset."
                ),
                "evidence": {
                    "register_address": event.register_address,
                    "value": event.value,
                    "state": "STOPPED",
                },
            }

    return None
