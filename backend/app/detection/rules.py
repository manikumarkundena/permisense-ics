from app.schemas.events import PermiSenseEvent, EventType, Severity


OVERSPEED_THRESHOLD = 80.0
HIGH_LOAD_THRESHOLD = 80.0

CONTROL_TITLES = {
    40001: "Motor enable change observed",
    40002: "PLC operating mode change observed",
    40003: "Conveyor speed setpoint change observed",
    40004: "Acceleration limit change observed",
    40005: "Production target change observed",
    40006: "PLC reset command observed",
    40010: "Overspeed limit change observed",
    40011: "High-load limit change observed",
    40012: "Jam timeout change observed",
    40013: "PLC configuration version change observed",
}


def detect_event(event: PermiSenseEvent) -> list[dict]:
    """Deterministic industrial detection rules. No AI or random scoring."""
    detections = []

    if event.event_type == EventType.CONTROL_WRITE:
        title = CONTROL_TITLES.get(
            event.register_address,
            "Industrial control write observed",
        )
        detections.append({
            "rule_id": "ICS-CONTROL-WRITE",
            "severity": Severity.HIGH,
            "title": title,
            "reason": (
                f"A control value changed on register "
                f"{event.register_address} of {event.asset_id}: "
                f"{event.previous_value} → {event.value}."
            ),
            "evidence": {
                "register_address": event.register_address,
                "previous_value": event.previous_value,
                "new_value": event.value,
                "protocol": event.protocol,
                "source_address": event.source_address,
                "observation_method": event.metadata.get("observation_method"),
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

    if (
        event.register_address == 30007
        and event.value is not None
        and int(event.value) == 0
    ):
        detections.append({
            "rule_id": "PROCESS-STOPPED",
            "severity": Severity.HIGH,
            "title": "Manufacturing process stopped",
            "reason": "The PLC reports a stopped process state.",
            "evidence": {
                "process_state": event.value,
                "state": "STOPPED",
            },
        })

    return detections
