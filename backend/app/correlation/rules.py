from datetime import timedelta

from app.models.telemetry_event import TelemetryEvent


CORRELATION_WINDOW_SECONDS = 30


def correlate_control_to_process(
    control_event: TelemetryEvent,
    process_events: list[TelemetryEvent],
) -> dict | None:

    if control_event.event_type != "control_write":
        return None

    window_end = control_event.timestamp + timedelta(
        seconds=CORRELATION_WINDOW_SECONDS
    )

    matching_events = []

    for event in process_events:
        if event.asset_id != control_event.asset_id:
            continue

        if event.process_id != control_event.process_id:
            continue

        if not (
            control_event.timestamp
            <= event.timestamp
            <= window_end
        ):
            continue

        if event.event_type != "sensor_update":
            continue

        if (
            event.register_address == 30001
            and event.value is not None
            and event.value > 80
        ):
            matching_events.append(event)

        elif (
            event.register_address == 30003
            and event.value is not None
            and event.value > 80
        ):
            matching_events.append(event)

        elif (
            event.register_address == 30006
            and event.value == 1
        ):
            matching_events.append(event)

    if not matching_events:
        return None

    return {
        "control_event": control_event,
        "process_events": matching_events,
    }
