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
from app.response.playbooks import get_playbook

router = APIRouter(prefix="/api/incidents", tags=["Response"])

CONTROL_OFFSETS = {
    40001: 0,
    40002: 1,
    40003: 2,
    40004: 3,
    40005: 4,
    40006: 5,
    40010: 9,
    40011: 10,
    40012: 11,
    40013: 12,
}

CONTROL_SCALES = {
    40001: 1.0,
    40002: 1.0,
    40003: 10.0,
    40004: 10.0,
    40005: 10.0,
    40010: 10.0,
    40011: 10.0,
    40012: 10.0,
    40013: 1.0,
}

PROCESS_OFFSETS = {
    30001: 0,
    30002: 1,
    30003: 2,
    30004: 3,
    30005: 4,
    30006: 5,
    30007: 6,
}

PROCESS_SCALES = {
    30001: 0.1,
    30002: 0.1,
    30003: 0.1,
    30004: 0.1,
    30005: 1.0,
    30006: 1.0,
    30007: 1.0,
}

REGISTER_LABELS = {
    40001: "Motor enable",
    40002: "Operating mode",
    40003: "Speed setpoint",
    40004: "Acceleration limit",
    40005: "Production target",
    40010: "Overspeed limit",
    40011: "High-load limit",
    40012: "Jam timeout",
    40013: "Configuration version",
}

REGISTER_UNITS = {
    40001: "",
    40002: "",
    40003: "RPM",
    40004: "RPM/s",
    40005: "units",
    40010: "RPM",
    40011: "%",
    40012: "s",
    40013: "",
}

PROCESS_LABELS = {
    30001: "Actual speed",
    30002: "Motor current",
    30003: "Motor load",
    30004: "Position",
    30005: "Workpieces",
    30006: "Jam state",
    30007: "Process state",
}

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


def _target_from_evidence(evidence: dict, register_address: int) -> float | int | None:
    previous = (evidence.get("control") or {}).get("previous_value")
    if previous is None:
        return None

    if register_address in {40001, 40002, 40013}:
        return int(round(float(previous)))
    return float(previous)


def _raw_control_value(register_address: int, target: float | int) -> int:
    scale = CONTROL_SCALES[register_address]
    return int(round(float(target) * scale))


def _decode_process_value(register_address: int, raw: int) -> float | int:
    scale = PROCESS_SCALES[register_address]
    if scale == 1.0:
        return int(raw)
    return raw * scale


def _verification_threshold(playbook) -> str:
    if playbook.verification_type in {"speed", "load"}:
        return "<= 80"
    if playbook.verification_type == "jam":
        return "== 0 (no jam)"
    if playbook.verification_type == "process_state":
        return "0 or 2 (stopped/idle)"
    return "control readback matches approved target"


def _response_states(response: dict) -> tuple[str, str, str]:
    approved = bool(response.get("approved"))
    executed = bool(response.get("executed"))
    recovered = bool(response.get("recovered"))

    approval_state = "APPROVED" if approved else "PENDING"
    execution_state = "EXECUTED" if executed else "PENDING"
    recovery_state = "RECOVERED" if recovered else ("VERIFYING" if executed else "UNRECOVERED")
    return approval_state, execution_state, recovery_state


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
    register_address = control.get("register_address")
    playbook = get_playbook(register_address)

    if playbook is None:
        return {
            "incident_id": incident_id,
            "recommendations": [],
            "approved": response.get("approved", False),
            "executed": response.get("executed", False),
            "recovered": response.get("recovered", False),
        }

    target = _target_from_evidence(evidence, register_address)
    if target is None:
        return {
            "incident_id": incident_id,
            "recommendations": [],
            "approved": False,
            "executed": False,
            "recovered": False,
        }

    approval_state, execution_state, recovery_state = _response_states(response)
    recommendation = {
        "action": playbook.action,
        "description": playbook.description,
        "register_address": playbook.register_address,
        "register_name": REGISTER_LABELS.get(playbook.register_address, f"R{playbook.register_address}"),
        "current_value": control.get("new_value"),
        "target_value": target,
        "unit": REGISTER_UNITS.get(playbook.register_address, ""),
        "requires_human_approval": True,
        "verification_register": playbook.verification_register,
        "verification_register_name": (
            PROCESS_LABELS.get(playbook.verification_register)
            if playbook.verification_register is not None
            else None
        ),
        "verification_type": playbook.verification_type,
        "verification_threshold": _verification_threshold(playbook),
    }

    return {
        "incident_id": incident_id,
        "recommendations": [recommendation],
        "approved": response.get("approved", False),
        "approved_by": response.get("approved_by"),
        "approved_at": response.get("approved_at"),
        "executed": response.get("executed", False),
        "executed_at": response.get("executed_at"),
        "recovered": response.get("recovered", False),
        "approval_state": approval_state,
        "execution_state": execution_state,
        "recovery_state": recovery_state,
    }


@router.post("/{incident_id}/response/approve")
async def approve_response(
    incident_id: str,
    payload: ApprovalRequest,
    session: AsyncSession = Depends(get_db),
):
    incident = await _get_incident(session, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = dict(incident.evidence_json or {})
    control = dict(evidence.get("control", {}))
    register_address = control.get("register_address")
    playbook = get_playbook(register_address)

    if playbook is None or payload.action != playbook.action:
        raise HTTPException(status_code=400, detail="Unsupported response action")

    if not payload.approved_by.strip():
        raise HTTPException(status_code=400, detail="approved_by is required")

    existing_response = dict(evidence.get("response", {}))
    if existing_response.get("executed"):
        raise HTTPException(
            status_code=409,
            detail="Response has already been executed for this incident",
        )

    if evidence.get("risk", {}).get("level") not in {"high", "critical"}:
        raise HTTPException(
            status_code=400,
            detail="Response is only available for high/critical incidents",
        )

    target = _target_from_evidence(evidence, register_address)
    if target is None:
        raise HTTPException(
            status_code=409,
            detail="No observed previous control value is available for safe restoration",
        )

    client = ModbusTcpClient(settings.modbus_host, port=settings.modbus_port)
    if not client.connect():
        raise HTTPException(status_code=503, detail="PLC is unavailable")

    try:
        write = client.write_register(
            address=CONTROL_OFFSETS[register_address],
            value=_raw_control_value(register_address, target),
            device_id=PLC_DEVICE_ID,
        )
        if write.isError():
            raise HTTPException(status_code=502, detail="PLC rejected response command")

        readback = client.read_holding_registers(
            address=CONTROL_OFFSETS[register_address],
            count=1,
            device_id=PLC_DEVICE_ID,
        )
        if readback.isError():
            raise HTTPException(status_code=502, detail="PLC rejected response verification read")

        readback_value = readback.registers[0] / CONTROL_SCALES[register_address]
    finally:
        client.close()

    if abs(float(readback_value) - float(target)) > 1e-6:
        raise HTTPException(
            status_code=502,
            detail="PLC response write did not read back to the approved target",
        )

    now = datetime.now(timezone.utc).isoformat()
    response = {
        **existing_response,
        "action": payload.action,
        "approved": True,
        "approved_by": payload.approved_by.strip(),
        "approved_at": now,
        "executed_at": now,
        "executed": True,
        "execution_id": str(uuid4()),
        "target_register": register_address,
        "target_value": target,
        "execution_method": "modbus_tcp",
        "readback_value": readback_value,
        "recovered": False,
    }
    evidence["response"] = response
    evidence["incident"] = {
        **dict(evidence.get("incident", {})),
        "status": "responded",
    }
    incident.evidence_json = evidence
    await session.commit()

    return {"status": "executed", "incident_id": incident_id, "response": response}


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
        raise HTTPException(status_code=400, detail="No approved response has been executed")

    register_address = int(response["target_register"])
    target = float(response["target_value"])
    playbook = get_playbook(register_address)
    if playbook is None:
        raise HTTPException(status_code=409, detail="Response playbook is no longer available")

    client = ModbusTcpClient(settings.modbus_host, port=settings.modbus_port)
    if not client.connect():
        raise HTTPException(status_code=503, detail="PLC is unavailable")

    try:
        control_read = client.read_holding_registers(
            address=CONTROL_OFFSETS[register_address],
            count=1,
            device_id=PLC_DEVICE_ID,
        )
        if control_read.isError():
            raise HTTPException(status_code=502, detail="PLC rejected recovery control read")

        control_value = control_read.registers[0] / CONTROL_SCALES[register_address]

        process_value = None
        if playbook.verification_register is not None:
            process_offset = PROCESS_OFFSETS[playbook.verification_register]
            process_read = client.read_input_registers(
                address=process_offset,
                count=1,
                device_id=PLC_DEVICE_ID,
            )
            if process_read.isError():
                raise HTTPException(status_code=502, detail="PLC rejected recovery process read")
            process_value = _decode_process_value(
                playbook.verification_register,
                process_read.registers[0],
            )
    finally:
        client.close()

    control_recovered = abs(float(control_value) - target) <= 1e-6

    if playbook.verification_type == "speed":
        process_recovered = float(process_value) <= 80.0 if process_value is not None else False
    elif playbook.verification_type == "load":
        process_recovered = float(process_value) <= 80.0 if process_value is not None else False
    elif playbook.verification_type == "jam":
        process_recovered = int(process_value or 0) == 0
    elif playbook.verification_type == "process_state":
        process_recovered = int(process_value or -1) in {0, 2}
    else:
        process_recovered = True

    recovered = control_recovered and process_recovered

    response["recovery_checked_at"] = datetime.now(timezone.utc).isoformat()
    response["control_readback"] = control_value
    response["process_verification_register"] = playbook.verification_register
    response["process_verification_value"] = process_value
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
        "control_register": register_address,
        "control_value": control_value,
        "target_value": target,
        "process_register": playbook.verification_register,
        "process_value": process_value,
        "verification_type": playbook.verification_type,
        "verification_threshold": _verification_threshold(playbook),
        "verified_at": response["recovery_checked_at"],
        "status": "recovered" if recovered else "awaiting_recovery",
    }
