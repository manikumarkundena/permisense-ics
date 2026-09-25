from uuid import uuid4

from app.correlation.mitre import get_mitre_mappings
from app.correlation.rules import correlate_control_to_process
from app.correlation.schemas import CorrelationResult
from app.evidence.service import build_evidence_graph
from app.impact.service import evaluate_impact
from app.models.telemetry_event import TelemetryEvent
from app.risk.service import assess_operational_risk
from app.schemas.events import Severity


REGISTER_LABELS = {
    40001: "motor enable",
    40002: "operating mode",
    40003: "speed setpoint",
    40004: "acceleration limit",
    40005: "production target",
    40010: "overspeed limit",
    40011: "high-load limit",
    40012: "jam timeout",
    40013: "configuration version",
}


def evaluate_correlation(
    control_event: TelemetryEvent,
    process_events: list[TelemetryEvent],
    detection_ids: list[str] | None = None,
    detection_details: list[dict] | None = None,
) -> CorrelationResult | None:
    result = correlate_control_to_process(control_event, process_events)
    if result is None:
        return None

    process_events = result["process_events"]
    event_ids = [
        control_event.event_id,
        *[event.event_id for event in process_events],
    ]

    # Use the earliest correlated process event for the evidence-grade delay.
    first_process_event = min(process_events, key=lambda event: event.timestamp)
    correlation_seconds = (
        first_process_event.timestamp - control_event.timestamp
    ).total_seconds()

    mitre_mappings = get_mitre_mappings(
        "ICS-CONTROL-WRITE",
        control_event.register_address,
    )

    impact = evaluate_impact(
        asset_id=control_event.asset_id,
        process_id=control_event.process_id,
        process_events=process_events,
    )
    impact_dict = impact.model_dump(mode="json") if impact else None

    impact_evidence = (impact_dict or {}).get("evidence", {})
    process_value = impact_evidence.get("value")
    process_threshold = impact_evidence.get("threshold")
    impact_type = impact_dict.get("impact_type") if impact_dict else None

    risk = assess_operational_risk(
        severity=Severity.HIGH,
        control_manipulation=True,
        process_impact=impact is not None,
        process_value=float(process_value) if process_value is not None else None,
        process_threshold=(
            float(process_threshold) if process_threshold is not None else None
        ),
        impact_type=impact_type,
        correlation_seconds=correlation_seconds,
    )
    risk_dict = risk.model_dump(mode="json")

    correlation_dict = {
        "time_delta_ms": round(correlation_seconds * 1000, 2),
        "window_seconds": 30,
        "matched_process_event_id": first_process_event.event_id,
    }

    graph = build_evidence_graph(
        control_event_id=control_event.event_id,
        process_event_ids=[event.event_id for event in process_events],
        detection_ids=detection_ids or [],
        detection_details=detection_details,
        mitre_mappings=mitre_mappings,
        impact=impact_dict,
        risk=risk_dict,
    )
    graph_dict = graph.model_dump(mode="json")

    label = REGISTER_LABELS.get(
        control_event.register_address,
        f"register {control_event.register_address}",
    )
    impact_title = impact.title if impact else "Process deviation"

    evidence = {
        "control": {
            "event_id": control_event.event_id,
            "register_address": control_event.register_address,
            "previous_value": control_event.previous_value,
            "new_value": control_event.value,
            "protocol": control_event.protocol,
            "source_address": control_event.source_address,
        },
        "process_events": [
            {
                "event_id": event.event_id,
                "register_address": event.register_address,
                "value": event.value,
                "unit": event.unit,
            }
            for event in process_events
        ],
        "detections": detection_details or [],
        "mitre_mappings": mitre_mappings,
        "impact": impact_dict,
        "risk": risk_dict,
        "evidence_graph": graph_dict,
        "correlation": correlation_dict,
        "window_seconds": 30,
    }

    return CorrelationResult(
        correlation_id=str(uuid4()),
        asset_id=control_event.asset_id,
        process_id=control_event.process_id,
        timestamp=process_events[-1].timestamp,
        severity=Severity.HIGH,
        title=f"Unauthorized {label} change caused process deviation",
        reason=(
            f"A change to the PLC {label} "
            f"({control_event.previous_value} → {control_event.value}) "
            f"was followed by {impact_title.lower()} on the same asset "
            f"{correlation_seconds:.2f} seconds later."
        ),
        event_ids=event_ids,
        detection_ids=detection_ids or [],
        mitre_mappings=mitre_mappings,
        impact=impact_dict,
        risk=risk_dict,
        evidence_graph=graph_dict,
        evidence=evidence,
    )
