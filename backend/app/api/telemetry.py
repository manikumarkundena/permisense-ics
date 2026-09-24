from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

from app.correlation.repository import (
    correlation_already_exists,
    find_recent_control_events,
    get_detection_details_for_events,
    get_detection_ids_for_events,
    save_correlation,
)
from app.correlation.service import evaluate_correlation
from app.detection.repository import save_detection
from app.detection.service import evaluate_event
from app.schemas.events import PermiSenseEvent
from app.telemetry.repository import save_event


router = APIRouter(
    prefix="/api/telemetry",
    tags=["Telemetry"],
)


@router.post(
    "/events",
    status_code=status.HTTP_201_CREATED,
)
async def ingest_event(
    event: PermiSenseEvent,
    session: AsyncSession = Depends(get_db),
):
    saved_event = await save_event(session, event)

    detection_results = evaluate_event(event)
    saved_detections = []

    for detection_result in detection_results:
        saved_detection = await save_detection(
            session,
            detection_result,
        )
        saved_detections.append(saved_detection)

    correlations = []

    if saved_event.event_type == "sensor_update":
        recent_controls = await find_recent_control_events(
            session,
            saved_event,
        )

        for control_event in recent_controls:
            if await correlation_already_exists(
                session,
                control_event.event_id,
            ):
                continue

            candidate_event_ids = [
                control_event.event_id,
                saved_event.event_id,
            ]
            detection_ids = await get_detection_ids_for_events(
                session,
                candidate_event_ids,
            )
            detection_details = await get_detection_details_for_events(
                session,
                candidate_event_ids,
            )

            correlation_result = evaluate_correlation(
                control_event,
                [saved_event],
                detection_ids=detection_ids,
                detection_details=detection_details,
            )

            if correlation_result is None:
                continue

            saved_correlation = await save_correlation(
                session,
                correlation_result,
            )

            correlations.append(
                {
                    "correlation_id": saved_correlation.correlation_id,
                    "severity": saved_correlation.severity,
                    "title": saved_correlation.title,
                    "risk": correlation_result.risk,
                    "impact": correlation_result.impact,
                    "mitre_mappings": correlation_result.mitre_mappings,
                    "evidence_graph": correlation_result.evidence_graph,
                }
            )

    return {
        "status": "accepted",
        "event_id": saved_event.event_id,
        "timestamp": saved_event.timestamp,
        "detections": [
            {
                "detection_id": detection.detection_id,
                "rule_id": detection.rule_id,
                "severity": detection.severity,
                "title": detection.title,
            }
            for detection in saved_detections
        ],
        "correlations": correlations,
    }
