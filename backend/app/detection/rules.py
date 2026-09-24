from app.schemas.events import PermiSenseEvent, EventType, Severity


def detect_event(event: PermiSenseEvent) -> list[dict]:
    """
    Deterministic industrial detection rules.

    This function does not use AI or random scoring.
    """

    detections = []

    # ---------------------------------------------------------
    # Rule 1: Control write
    # ---------------------------------------------------------
    if event.event_type == EventType.CONTROL_WRITE:
        detections.append({
            "rule_id": "ICS-CONTROL-WRITE",
            "severity": Severity.HIGH,
            "title": "Industrial control write observed",
            "reason": (
                f"A control value was written to register "
                f"{event.register_address} on {event.asset_id}."
            ),
            "evidence": {
                "register_address": event.register_address,
                "previous_value": event.previous_value,
                "new_value": event.value,
                "protocol": event.protocol,
                "source_address": event.source_address,
            },
        })

    # ---------------------------------------------------------
    # Rule 2: High speed
    # ---------------------------------------------------------
    if (
        event.register_address == 30001
        and event.value is not None
        and float(event.value) > 80.0
    ):
        detections.append({
            "rule_id": "PROCESS-OVERSPEED",
            "severity": Severity.HIGH,
            "title": "Conveyor overspeed detected",
            "reason": (
                f"Actual conveyor speed reached "
                f"{event.value}%."
            ),
            "evidence": {
                "actual_speed": event.value,
                "threshold": 80.0,
                "unit": event.unit,
            },
        })

    # ---------------------------------------------------------
    # Rule 3: High motor load
    # ---------------------------------------------------------
    if (
        event.register_address == 30003
        and event.value is not None
        and float(event.value) > 80.0
    ):
        detections.append({
            "rule_id": "PROCESS-HIGH-LOAD",
            "severity": Severity.HIGH,
            "title": "High motor load detected",
            "reason": (
                f"Motor load reached {event.value}%."
            ),
            "evidence": {
                "motor_load": event.value,
                "threshold": 80.0,
                "unit": event.unit,
            },
        })

    # ---------------------------------------------------------
    # Rule 4: Jam
    # ---------------------------------------------------------
    if (
        event.register_address == 30006
        and event.value is not None
        and int(event.value) == 1
    ):
        detections.append({
            "rule_id": "PROCESS-JAM",
            "severity": Severity.HIGH,
            "title": "Conveyor jam detected",
            "reason": "The PLC reports an active conveyor jam.",
            "evidence": {
                "jam_state": event.value,
            },
        })

    return detections
