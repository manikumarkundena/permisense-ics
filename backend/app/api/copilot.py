import json

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.correlation import Correlation

router = APIRouter(prefix="/api/incidents", tags=["AI Copilot"])


class CopilotChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1200)


def evidence_payload(incident: Correlation) -> dict:
    evidence = incident.evidence_json or {}
    return {
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
        "response": evidence.get("response", {}),
        "correlation": evidence.get("correlation"),
    }


async def generate(prompt: str) -> dict:
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured on the backend.",
        )

    # Use current stable models for new Gemini API projects. Google currently
    # recommends 3.8 Flash or 3.5 Flash-Lite instead of 2.5 for new projects.
    models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }

    failures: list[str] = []

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            for model in models:
                url = (
                    "https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{model}:generateContent"
                )

                try:
                    response = await client.post(
                        url,
                        headers={
                            "Content-Type": "application/json",
                            "x-goog-api-key": settings.gemini_api_key,
                        },
                        json=payload,
                    )
                except httpx.HTTPError as exc:
                    failures.append(f"{model}: network error: {exc}")
                    continue

                if response.is_success:
                    try:
                        data = response.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = json.loads(text)
                        if not isinstance(parsed, dict):
                            raise ValueError("Gemini returned JSON that is not an object")
                        parsed.setdefault("model", model)
                        return parsed
                    except (KeyError, IndexError, TypeError, json.JSONDecodeError, ValueError) as exc:
                        failures.append(f"{model}: invalid structured response: {exc}")
                        continue

                body = response.text[:2000]
                failures.append(f"{model}: HTTP {response.status_code}: {body}")

                if response.status_code not in {400, 401, 403, 404, 408, 429, 500, 502, 503, 504}:
                    break

    except httpx.HTTPError as exc:
        failures.append(f"Gemini transport error: {exc}")

    raise HTTPException(
        status_code=502,
        detail="Gemini Copilot generation failed. " + " | ".join(failures),
    )


@router.post("/{incident_id}/copilot")
async def copilot(
    incident_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Correlation).where(Correlation.correlation_id == incident_id)
    )
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    prompt = """You are the PermiSense industrial cybersecurity copilot.
Use ONLY the supplied evidence. Do not invent facts, attacker identity, physical damage,
or conclusions unsupported by the evidence. Return concise JSON with keys:
summary, evidence, impact, recommended_action, confidence_note.
The recommended action is advisory only; a human must approve any response.

EVIDENCE:
""" + json.dumps(evidence_payload(incident), default=str)

    return {
        "incident_id": incident_id,
        "grounded": True,
        "copilot": await generate(prompt),
    }


@router.post("/{incident_id}/copilot/chat")
async def copilot_chat(
    incident_id: str,
    request: CopilotChatRequest,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Correlation).where(Correlation.correlation_id == incident_id)
    )
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    prompt = """You are the PermiSense incident copilot for a human operator.
Answer the operator's question using ONLY the supplied incident evidence.
Never invent attacker identity, intent, physical damage, telemetry, timestamps,
or recovery state. If the evidence does not answer the question, say so clearly.
Do not authorize or execute actions. If discussing a response, state that it
requires human approval. Return JSON with exactly these keys:
answer, evidence_used, action_advisory, limitation.
Keep the answer concise and operationally useful.

OPERATOR QUESTION:
""" + request.question + """

INCIDENT EVIDENCE:
""" + json.dumps(evidence_payload(incident), default=str)

    return {
        "incident_id": incident_id,
        "grounded": True,
        "question": request.question,
        "copilot": await generate(prompt),
    }
