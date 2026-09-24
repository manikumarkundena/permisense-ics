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
SAFE_SPEED_THRESHOLD = 80.0
SPEED_REGISTER = 40003
SPEED_OFFSET = 2
ACTUAL_SPEED_OFFSET = 0
PLC_DEVICE_ID = 1


class ApprovalRequest(BaseModel):
    action: str
    approved_by: str = "operator"


async def _get_incident(session: AsyncSession, incident_id: str):
    result = await session.execute(
        select(Correlation).where(
            Correlation.correlation_id == incident_id
        )
    )
    return result.scalar_one_or_none()


@router.get("/{incident_id}/response")
async def response_plan(
    incident_id: str,
    session: AsyncSession = Depends(get_db),
):
    incident = await _get_incident(session, incident_id)

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = incident.evidence_json or {}
    response = evidence.get("response", {})
    control = evidence.get("control", {})

    return {
        "incident_id": incident_id,
        "recommendations": [
            {
                "action": "set_safe_speed",
                "description": (
                    f"Restore conveyor speed setpoint to "
                    f"{SAFE_SPEED_SETPOINT}%."
                ),
                "register_address": SPEED_REGISTER,
                "current_value": control.get("new_value"),
                "target_value": SAFE_SPEED_SETPOINT,
                "requires_human_approval": True,
            }
        ],
        "approved": response.get("approved", False),
        "executed": response.get("executed", False),
        "recovered": response.get("recovered", False),
    }


@router.post("/{incident_id}/response/approve")
async def approve_response(
    incident_id: str,
    payload: ApprovalRequest,
    session: AsyncSession = Depends(get_db),
):
    if payload.action != "set_safe_speed":
        raise HTTPException(
            status_code=400,
            detail="Unsupported response action",
        )

    if not payload.approved_by.strip():
        raise HTTPException(
            status_code=400,
            detail="approved_by is required",
        )

    incident = await _get_incident(session, incident_id)

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = dict(incident.evidence_json or {})
    existing_response = dict(evidence.get("response", {}))

    if existing_response.get("executed"):
        raise HTTPException(
            status_code=409,
            detail="Response has already been executed for this incident",
        )

    if (
        evidence.get("risk", {}).get("level")
        not in {"high", "critical"}
    ):
        raise HTTPException(
            status_code=400,
            detail="Response is only available for high/critical incidents",
        )

    client = ModbusTcpClient(
        settings.modbus_host,
        port=settings.modbus_port,
    )

    if not client.connect():
        raise HTTPException(
            status_code=503,
            detail="PLC is unavailable",
        )

    try:
        raw_value = int(SAFE_SPEED_SETPOINT * 10)
        write = client.write_register(
            address=SPEED_OFFSET,
            value=raw_value,
            device_id=PLC_DEVICE_ID,
        )
        if write.isError():
            raise HTTPException(
                status_code=502,
                detail="PLC rejected response command",
            )
    finally:
        client.close()

    now = datetime.now(timezone.utc).isoformat()
    response = {
        **existing_response,
        "action": payload.action,
        "approved": True,
        "approved_by": payload.approved_by.strip(),
        "approved_at": now,
        "executed": True,
        "execution_id": str(uuid4()),
        "target_register": SPEED_REGISTER,
        "target_value": SAFE_SPEED_SETPOINT,
        "execution_method": "modbus_tcp",
        "recovered": False,
    }
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


@router.post("/{incident_id}/response/verify")
async def verify_recovery(
    incident_id: str,
    session: AsyncSession = Depends(get_db),
):
    incident = await _get_incident(session, incident_id)

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = dict(incident.evidence_json or {})
    response = dict(evidence.get("response", {}))

    if not response.get("executed"):
        raise HTTPException(
            status_code=400,
            detail="No approved response has been executed",
        )

    client = ModbusTcpClient(
        settings.modbus_host,
        port=settings.modbus_port,
    )

    if not client.connect():
        raise HTTPException(
            status_code=503,
            detail="PLC is unavailable",
        )

    try:
        read = client.read_input_registers(
            address=ACTUAL_SPEED_OFFSET,
            count=1,
            device_id=PLC_DEVICE_ID,
        )
        if read.isError():
            raise HTTPException(
                status_code=502,
                detail="PLC rejected recovery verification read",
            )
        actual_speed = read.registers[0] * 0.1
    finally:
        client.close()

    recovered = actual_speed <= SAFE_SPEED_THRESHOLD
    response["recovery_checked_at"] = datetime.now(timezone.utc).isoformat()
    response["actual_speed"] = actual_speed
    response["recovered"] = recovered
    evidence["response"] = response

    if recovered:
        evidence["incident"] = {
            **dict(evidence.get("incident", {})),
            "status": "recovered",
        }

    incident.evidence_json = evidence
    await session.commit()

    return {
        "incident_id": incident_id,
        "recovered": recovered,
        "actual_speed": actual_speed,
        "threshold": SAFE_SPEED_THRESHOLD,
        "status": "recovered" if recovered else "awaiting_recovery",
    }
