from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pymodbus.client import ModbusTcpClient

from app.core.config import settings
from app.core.database import get_db
from app.models.correlation import Correlation

router = APIRouter(prefix="/api/incidents", tags=["Response"])


SAFE_SPEED_SETPOINT = 50.0
SPEED_REGISTER = 40003
SPEED_OFFSET = 2
PLC_DEVICE_ID = 1


class ApprovalRequest(BaseModel):
    action: str
    approved_by: str = "operator"


def _get_incident(session: AsyncSession, incident_id: str):
    return session.execute(
        select(Correlation).where(
            Correlation.correlation_id == incident_id
        )
    )


@router.get("/{incident_id}/response")
async def response_plan(
    incident_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await _get_incident(session, incident_id)
    incident = result.scalar_one_or_none()

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    return {
        "incident_id": incident_id,
        "recommendations": [
            {
                "action": "set_safe_speed",
                "description": f"Restore conveyor speed setpoint to {SAFE_SPEED_SETPOINT}%.",
                "register_address": SPEED_REGISTER,
                "target_value": SAFE_SPEED_SETPOINT,
                "requires_human_approval": True,
            }
        ],
        "approved": incident.evidence_json.get("response", {}).get("approved", False),
        "executed": incident.evidence_json.get("response", {}).get("executed", False),
    }


@router.post("/{incident_id}/response/approve")
async def approve_response(
    incident_id: str,
    payload: ApprovalRequest,
    session: AsyncSession = Depends(get_db),
):
    if payload.action != "set_safe_speed":
        raise HTTPException(status_code=400, detail="Unsupported response action")

    result = await _get_incident(session, incident_id)
    incident = result.scalar_one_or_none()

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.evidence_json.get("risk", {}).get("level") not in {"high", "critical"}:
        raise HTTPException(status_code=400, detail="Response is only available for high/critical incidents")

    client = ModbusTcpClient(
        settings.modbus_host,
        port=settings.modbus_port,
    )

    if not client.connect():
        raise HTTPException(status_code=503, detail="PLC is unavailable")

    try:
        raw_value = int(SAFE_SPEED_SETPOINT * 10)
        write = client.write_register(
            address=SPEED_OFFSET,
            value=raw_value,
            device_id=PLC_DEVICE_ID,
        )
        if write.isError():
            raise HTTPException(status_code=502, detail="PLC rejected response command")
    finally:
        client.close()

    now = datetime.now(timezone.utc).isoformat()
    evidence = dict(incident.evidence_json or {})
    response = dict(evidence.get("response", {}))
    response.update({
        "action": payload.action,
        "approved": True,
        "approved_by": payload.approved_by,
        "approved_at": now,
        "executed": True,
        "execution_id": str(uuid4()),
        "target_register": SPEED_REGISTER,
        "target_value": SAFE_SPEED_SETPOINT,
        "execution_method": "modbus_tcp",
    })
    evidence["response"] = response
    evidence["incident"] = {
        **dict(evidence.get("incident", {})),
        "status": "responded",
    }
    incident.evidence_json = evidence

    await session.commit()

    return {
        "status": "executed",
        "incident_id": incident_id,
        "response": response,
    }
