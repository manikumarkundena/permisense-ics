import json

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.correlation import Correlation

router = APIRouter(prefix="/api/incidents", tags=["AI Copilot"])


@router.post("/{incident_id}/copilot")
async def copilot(
    incident_id: str,
    session: AsyncSession = Depends(get_db),
):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="Gemini API key is not configured")

    result = await session.execute(
        select(Correlation).where(Correlation.correlation_id == incident_id)
    )
    incident = result.scalar_one_or_none()

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = incident.evidence_json or {}
    prompt = """You are the PermiSense industrial cybersecurity copilot.
Use ONLY the supplied evidence. Do not invent facts, attacker identity, physical damage,
or conclusions unsupported by the evidence. Return concise JSON with keys:
summary, evidence, impact, recommended_action, confidence_note.
The recommended action is advisory only; a human must approve any response.

EVIDENCE:
""" + json.dumps({
        "incident_id": incident.correlation_id,
        "asset_id": incident.asset_id,
        "severity": incident.severity,
        "title": incident.title,
        "reason": incident.reason,
        "detections": evidence.get("detections", []),
        "mitre_mappings": evidence.get("mitre_mappings", []),
        "impact": evidence.get("impact"),
        "risk": evidence.get("risk"),
        "control": evidence.get("control"),
        "process_events": evidence.get("process_events", []),
    }, default=str)

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.5-flash:generateContent"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url,
            params={"key": settings.gemini_api_key},
            json=payload,
        )

    if response.is_error:
        raise HTTPException(status_code=502, detail="Gemini request failed")

    data = response.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return {
            "incident_id": incident_id,
            "grounded": True,
            "copilot": json.loads(text),
        }
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Invalid structured response from Gemini: {exc}",
        )
