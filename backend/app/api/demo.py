from typing import Any

from fastapi import APIRouter, HTTPException
from pymodbus.client import ModbusTcpClient

from app.core.config import settings


router = APIRouter(prefix="/api/demo", tags=["Demo Lab"])

PLC_DEVICE_ID = 1

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
    40006: 1.0,
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


def _client() -> ModbusTcpClient:
    return ModbusTcpClient(
        settings.modbus_host,
        port=settings.modbus_port,
        timeout=3,
    )


def _read_registers(client: ModbusTcpClient) -> tuple[dict[int, float], dict[int, float]]:
    holding: dict[int, float] = {}
    input_values: dict[int, float] = {}

    for start, count in ((0, 6), (9, 4)):
        result = client.read_holding_registers(
            address=start,
            count=count,
            device_id=PLC_DEVICE_ID,
        )
        if result.isError():
            raise RuntimeError("Unable to read PLC control registers")

        for register, offset in CONTROL_OFFSETS.items():
            if start <= offset < start + count:
                holding[register] = (
                    result.registers[offset - start]
                    / CONTROL_SCALES[register]
                )

    result = client.read_input_registers(
        address=0,
        count=7,
        device_id=PLC_DEVICE_ID,
    )
    if result.isError():
        raise RuntimeError("Unable to read PLC process registers")

    for register, offset in PROCESS_OFFSETS.items():
        input_values[register] = (
            result.registers[offset] * PROCESS_SCALES[register]
        )

    return holding, input_values


def _write_control(
    register_address: int,
    target_value: float | int,
) -> dict[str, Any]:
    if register_address not in CONTROL_OFFSETS:
        raise RuntimeError("Demo scenario targets a non-allowlisted register")

    client = _client()
    if not client.connect():
        raise HTTPException(status_code=503, detail="Virtual PLC is unavailable")

    try:
        holding, process = _read_registers(client)
        current_value = holding[register_address]

        if abs(float(current_value) - float(target_value)) <= 1e-6:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Register {register_address} is already at "
                    f"{target_value}; start from the scenario baseline."
                ),
            )

        result = client.write_register(
            address=CONTROL_OFFSETS[register_address],
            value=int(round(float(target_value) * CONTROL_SCALES[register_address])),
            device_id=PLC_DEVICE_ID,
        )
        if result.isError():
            raise HTTPException(
                status_code=502,
                detail="Virtual PLC rejected the demo control write",
            )

        readback = client.read_holding_registers(
            address=CONTROL_OFFSETS[register_address],
            count=1,
            device_id=PLC_DEVICE_ID,
        )
        if readback.isError():
            raise HTTPException(
                status_code=502,
                detail="Unable to verify the demo control write",
            )

        readback_value = (
            readback.registers[0] / CONTROL_SCALES[register_address]
        )

        return {
            "register_address": register_address,
            "previous_value": current_value,
            "value": readback_value,
            "process_snapshot": process,
            "execution": "real_modbus_tcp",
            "allowlisted": True,
        }
    finally:
        client.close()


@router.get("/status")
async def demo_status():
    client = _client()

    if not client.connect():
        return {
            "status": "offline",
            "plc": "offline",
            "process": "unavailable",
            "scenarios": {
                "speed": "unavailable",
                "mode": "unavailable",
            },
        }

    try:
        holding, process = _read_registers(client)
        return {
            "status": "ready",
            "plc": "online",
            "process": {
                "speed": process[30001],
                "current": process[30002],
                "load": process[30003],
                "position": process[30004],
                "workpieces": process[30005],
                "jam": process[30006],
                "state": process[30007],
                "state_label": {
                    0: "STOPPED",
                    1: "STARTING",
                    2: "RUNNING",
                    3: "DEGRADED",
                    4: "JAMMED",
                    5: "FAULT",
                }.get(int(process[30007]), f"STATE_{int(process[30007])}"),
            },
            "controls": {
                "motor_enable": holding[40001],
                "operating_mode": holding[40002],
                "speed_setpoint": holding[40003],
                "acceleration_limit": holding[40004],
                "production_target": holding[40005],
                "overspeed_limit": holding[40010],
                "high_load_limit": holding[40011],
                "jam_timeout": holding[40012],
                "config_version": holding[40013],
            },
            "scenarios": {
                "speed": "ready" if holding[40003] != 90.0 else "already_triggered",
                "mode": (
                    "ready"
                    if holding[40002] != 0.0 and holding[40003] <= 80.0
                    else "reset_required"
                ),
            },
        }
    except Exception as exc:
        return {
            "status": "degraded",
            "plc": "online",
            "process": "unavailable",
            "error": str(exc),
        }
    finally:
        client.close()


@router.post("/scenarios/speed")
async def trigger_speed_scenario():
    return {
        "scenario": "unauthorized_speed_change",
        "description": "Real Modbus/TCP write to speed setpoint R40003: 50 → 90.",
        "result": _write_control(40003, 90.0),
    }


@router.post("/scenarios/mode")
async def trigger_mode_scenario():
    client = _client()

    if not client.connect():
        raise HTTPException(status_code=503, detail="Virtual PLC is unavailable")

    try:
        holding, _ = _read_registers(client)

        if holding[40003] > 80.0:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Mode scenario requires a clean process baseline. "
                    "Restore R40003 to a safe setpoint before triggering R40002."
                ),
            )
    finally:
        client.close()

    return {
        "scenario": "unauthorized_operating_mode_change",
        "description": "Real Modbus/TCP write to operating mode R40002: RUN → STOP.",
        "result": _write_control(40002, 0),
    }


@router.post("/reset")
async def reset_demo():
    """Restore the virtual PLC to the documented clean demo baseline.

    This is a real Modbus/TCP operation, not a frontend-only state reset.
    """
    client = _client()

    if not client.connect():
        raise HTTPException(status_code=503, detail="Virtual PLC is unavailable")

    baseline = {
        40002: 1.0,   # RUN / Auto
        40003: 50.0,  # safe speed setpoint
    }

    try:
        holding, _ = _read_registers(client)
        previous = {
            str(register): holding.get(register)
            for register in baseline
        }

        for register_address, target_value in baseline.items():
            if abs(float(holding[register_address]) - target_value) > 1e-6:
                result = client.write_register(
                    address=CONTROL_OFFSETS[register_address],
                    value=int(round(target_value * CONTROL_SCALES[register_address])),
                    device_id=PLC_DEVICE_ID,
                )
                if result.isError():
                    raise HTTPException(
                        status_code=502,
                        detail=f"Virtual PLC rejected baseline restore for R{register_address}",
                    )

        readback, process = _read_registers(client)
        restored = {
            str(register): readback[register]
            for register in baseline
        }

        if any(
            abs(float(restored[str(register)]) - float(target))
            > 1e-6
            for register, target in baseline.items()
        ):
            raise HTTPException(
                status_code=502,
                detail="Virtual PLC baseline restore did not read back to the approved targets",
            )

        return {
            "success": True,
            "execution": "real_modbus_tcp",
            "description": "Restored the documented clean demo baseline: R40002=RUN/Auto and R40003=50%.",
            "previous": previous,
            "restored": restored,
            "process_snapshot": process,
        }
    finally:
        client.close()
