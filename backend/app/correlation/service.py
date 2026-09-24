from uuid import uuid4

from app.correlation.mitre import get_mitre_mappings
from app.correlation.rules import correlate_control_to_process
from app.correlation.schemas import CorrelationResult
from app.evidence.service import build_evidence_graph
from app.impact.service import evaluate_impact
from app.models.telemetry_event import TelemetryEvent
from app.risk.service import assess_operational_risk
from app.schemas.events import Severity


def evaluate_correlation(
    control_event: TelemetryEvent,
    process_events: list[TelemetryEvent],
    detection_ids: list[str] | None = None,
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

    risk = assess_operational_risk(
        severity=Severity.HIGH,
        control_manipulation=True,
        process_impact=impact is not None,
    )
    risk_dict = risk.model_dump(mode="json")

    graph = build_evidence_graph(
        control_event_id=control_event.event_id,
        process_event_ids=[event.event_id for event in process_events],
        detection_ids=detection_ids or [],
        mitre_mappings=mitre_mappings,
        impact=impact_dict,
        risk=risk_dict,
    )
    graph_dict = graph.model_dump(mode="json")

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
        "mitre_mappings": mitre_mappings,
        "impact": impact_dict,
        "risk": risk_dict,
        "evidence_graph": graph_dict,
        "window_seconds": 30,
    }

    return CorrelationResult(
        correlation_id=str(uuid4()),
        asset_id=control_event.asset_id,
        process_id=control_event.process_id,
        timestamp=process_events[-1].timestamp,
        severity=Severity.HIGH,
        title="Control manipulation followed by process deviation",
        reason=(
            "A control write was followed by abnormal process telemetry "
            "on the same industrial asset within 30 seconds."
        ),
        event_ids=event_ids,
        detection_ids=detection_ids or [],
        mitre_mappings=mitre_mappings,
        impact=impact_dict,
        risk=risk_dict,
        evidence_graph=graph_dict,
        evidence=evidence,
    )
