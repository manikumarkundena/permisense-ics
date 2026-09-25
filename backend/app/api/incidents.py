from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.correlation import Correlation

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


def _incident(c: Correlation) -> dict:
    evidence = c.evidence_json or {}
    lifecycle = evidence.get("incident", {})
    return {
        "incident_id": c.correlation_id,
        "asset_id": c.asset_id,
        "process_id": c.process_id,
        "timestamp": c.timestamp,
        "severity": c.severity,
        "title": c.title,
        "reason": c.reason,
        "status": lifecycle.get("status", "open"),
        "event_ids": c.event_ids_json,
        "detection_ids": c.detection_ids_json,
        "detections": evidence.get("detections", []),
        "mitre_mappings": evidence.get("mitre_mappings", []),
        "impact": evidence.get("impact"),
        "risk": evidence.get("risk"),
        "evidence_graph": evidence.get("evidence_graph"),
        "response": evidence.get("response", {}),
        "control": evidence.get("control", {}),
        "process_events": evidence.get("process_events", []),
        "correlation": evidence.get("correlation"),
        "window_seconds": evidence.get("window_seconds"),
    }


@router.get("")
async def list_incidents(
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Correlation)
        .order_by(Correlation.timestamp.desc())
        .limit(100)
    )
    incidents = list(result.scalars().all())

    return {
        "count": len(incidents),
        "incidents": [_incident(c) for c in incidents],
    }


@router.get("/{incident_id}")
async def get_incident(
    incident_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Correlation).where(
            Correlation.correlation_id == incident_id
        )
    )
    incident_row = result.scalar_one_or_none()

    if incident_row is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    return _incident(incident_row)


@router.patch("/{incident_id}/status")
async def update_incident_status(
    incident_id: str,
    payload: dict,
    session: AsyncSession = Depends(get_db),
):
    allowed = {
        "open",
        "investigating",
        "action_pending",
        "responded",
        "recovered",
        "closed",
    }
    new_status = payload.get("status")

    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"status must be one of: {', '.join(sorted(allowed))}",
        )

    result = await session.execute(
        select(Correlation).where(
            Correlation.correlation_id == incident_id
        )
    )
    incident_row = result.scalar_one_or_none()

    if incident_row is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = dict(incident_row.evidence_json or {})
    lifecycle = dict(evidence.get("incident", {}))
    lifecycle["status"] = new_status
    evidence["incident"] = lifecycle
    incident_row.evidence_json = evidence

    await session.commit()
    await session.refresh(incident_row)

    return _incident(incident_row)
