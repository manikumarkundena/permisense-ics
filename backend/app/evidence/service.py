from app.evidence.schemas import (
    EvidenceEdge,
    EvidenceGraph,
    EvidenceNode,
)


def build_evidence_graph(
    *,
    control_event_id: str,
    process_event_ids: list[str],
    detection_ids: list[str],
    mitre_mappings: list[dict],
    impact: dict | None,
    risk: dict | None,
) -> EvidenceGraph:
    nodes: list[EvidenceNode] = [
        EvidenceNode(
            id=control_event_id,
            type="event",
            label="Control write",
        )
    ]

    edges: list[EvidenceEdge] = []

    for event_id in process_event_ids:
        nodes.append(
            EvidenceNode(
                id=event_id,
                type="event",
                label="Process telemetry",
            )
        )
        edges.append(
            EvidenceEdge(
                source=control_event_id,
                target=event_id,
                relation="followed_by",
            )
        )

    for detection_id in detection_ids:
        nodes.append(
            EvidenceNode(
                id=detection_id,
                type="detection",
                label="Detection",
            )
        )
        edges.append(
            EvidenceEdge(
                source=control_event_id,
                target=detection_id,
                relation="supported_by",
            )
        )

    for mapping in mitre_mappings:
        technique_id = mapping["technique_id"]
        node_id = f"mitre:{technique_id}"
        nodes.append(
            EvidenceNode(
                id=node_id,
                type="mitre",
                label=mapping["technique_name"],
                data=mapping,
            )
        )
        edges.append(
            EvidenceEdge(
                source=control_event_id,
                target=node_id,
                relation="mapped_to",
            )
        )

    if impact:
        impact_id = impact["impact_id"]
        nodes.append(
            EvidenceNode(
                id=impact_id,
                type="impact",
                label=impact["title"],
                data=impact,
            )
        )
        for event_id in process_event_ids:
            edges.append(
                EvidenceEdge(
                    source=event_id,
                    target=impact_id,
                    relation="demonstrates",
                )
            )

    if risk:
        risk_id = risk["risk_id"]
        nodes.append(
            EvidenceNode(
                id=risk_id,
                type="risk",
                label=f"Operational risk: {risk['level']}",
                data=risk,
            )
        )
        if impact:
            edges.append(
                EvidenceEdge(
                    source=impact["impact_id"],
                    target=risk_id,
                    relation="contributes_to",
                )
            )
        else:
            edges.append(
                EvidenceEdge(
                    source=control_event_id,
                    target=risk_id,
                    relation="assessed_as",
                )
            )

    return EvidenceGraph(nodes=nodes, edges=edges)
