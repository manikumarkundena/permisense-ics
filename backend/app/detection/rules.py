from app.schemas.events import PermiSenseEvent, EventType, Severity


# Current virtual-cell safety thresholds. These are explicit prototype
# detection thresholds and must remain aligned with the PLC configuration
# used by the demo scenario.
OVERSPEED_THRESHOLD = 80.0
HIGH_LOAD_THRESHOLD = 80.0


def detect_event(event: PermiSenseEvent) -> list[dict]:
    """Deterministic industrial detection rules. No AI or random scoring."""
    detections = []

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

    if (
        event.register_address == 30001
        and event.value is not None
        and float(event.value) > OVERSPEED_THRESHOLD
    ):
        detections.append({
            "rule_id": "PROCESS-OVERSPEED",
            "severity": Severity.HIGH,
            "title": "Conveyor overspeed detected",
            "reason": f"Actual conveyor speed reached {event.value}%.",
            "evidence": {
                "actual_speed": event.value,
                "threshold": OVERSPEED_THRESHOLD,
                "unit": event.unit,
            },
        })

    if (
        event.register_address == 30003
        and event.value is not None
        and float(event.value) > HIGH_LOAD_THRESHOLD
    ):
        detections.append({
            "rule_id": "PROCESS-HIGH-LOAD",
            "severity": Severity.HIGH,
            "title": "High motor load detected",
            "reason": f"Motor load reached {event.value}%.",
            "evidence": {
                "motor_load": event.value,
                "threshold": HIGH_LOAD_THRESHOLD,
                "unit": event.unit,
            },
        })

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
