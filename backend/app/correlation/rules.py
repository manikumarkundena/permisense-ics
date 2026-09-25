from datetime import timedelta

from app.models.telemetry_event import TelemetryEvent


CORRELATION_WINDOW_SECONDS = 30


def _is_process_deviation(control_event: TelemetryEvent, event: TelemetryEvent) -> bool:
    if event.event_type != "sensor_update":
        return False

    register = control_event.register_address
    value = event.value

    if register in {40003, 40004}:
        return (
            event.register_address == 30001
            and value is not None
            and float(value) > 80
        )

    if register == 40001 and control_event.value == 0:
        return (
            event.register_address == 30001
            and value is not None
            and float(value) <= 1
        )

    if register == 40002 and control_event.value != 1:
        return (
            event.register_address == 30007
            and value is not None
            and int(value) == 0
        )

    if register == 40010:
        return (
            event.register_address == 30001
            and value is not None
            and control_event.value is not None
            and float(value) > float(control_event.value)
        )

    if register == 40011:
        return (
            event.register_address == 30003
            and value is not None
            and control_event.value is not None
            and float(value) > float(control_event.value)
        )

    if register == 40012:
        return (
            event.register_address == 30006
            and value is not None
            and int(value) == 1
        )

    # Keep the remaining parameter writes as security detections until
    # their process model exposes a defensible impact signal.
    return (
        event.register_address == 30001
        and value is not None
        and float(value) > 80
    )


def correlate_control_to_process(
    control_event: TelemetryEvent,
    process_events: list[TelemetryEvent],
) -> dict | None:
    if control_event.event_type != "control_write":
        return None

    window_end = control_event.timestamp + timedelta(
        seconds=CORRELATION_WINDOW_SECONDS
    )

    matching_events = [
        event
        for event in process_events
        if (
            event.asset_id == control_event.asset_id
            and event.process_id == control_event.process_id
            and control_event.timestamp <= event.timestamp <= window_end
            and _is_process_deviation(control_event, event)
        )
    ]

    if not matching_events:
        return None

    return {
        "control_event": control_event,
        "process_events": matching_events,
    }
