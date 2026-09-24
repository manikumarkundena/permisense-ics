"""
PermiSense Modbus Telemetry Gateway.

Reads process telemetry from the virtual PLC over Modbus/TCP
and converts it into canonical PermiSense events.

The gateway does NOT perform detection.
"""

import asyncio
import logging
from datetime import datetime, timezone
from uuid import uuid4

import httpx
from pymodbus.client import ModbusTcpClient

from industrial_lab.plc.registers import RegisterAddress


logger = logging.getLogger("permisense.gateway")


PLC_HOST = "127.0.0.1"
PLC_PORT = 5020
PLC_DEVICE_ID = 1

BACKEND_URL = "http://127.0.0.1:8000"

POLL_INTERVAL = 1.0

ASSET_ID = "PLC-01"
ASSET_TYPE = "plc"
PROCESS_ID = "manufacturing-cell-01"


# Explicit mapping between semantic PLC registers
# and zero-based Modbus input-register offsets.
INPUT_REGISTERS = {
    RegisterAddress.ACTUAL_SPEED: {
        "offset": 0,
        "unit": "percent",
        "scale": 0.1,
    },
    RegisterAddress.MOTOR_CURRENT: {
        "offset": 1,
        "unit": "ampere",
        "scale": 0.1,
    },
    RegisterAddress.MOTOR_LOAD: {
        "offset": 2,
        "unit": "percent",
        "scale": 0.1,
    },
    RegisterAddress.POSITION: {
        "offset": 3,
        "unit": "percent",
        "scale": 0.1,
    },
    RegisterAddress.WORKPIECES_PROCESSED: {
        "offset": 4,
        "unit": "count",
        "scale": 1.0,
    },
    RegisterAddress.JAM_STATE: {
        "offset": 5,
        "unit": None,
        "scale": 1.0,
    },
    RegisterAddress.PROCESS_STATE: {
        "offset": 6,
        "unit": None,
        "scale": 1.0,
    },
}


def read_process_registers(
    client: ModbusTcpClient,
) -> dict[int, float]:
    """
    Read process telemetry from the virtual PLC.

    Returns:
        Mapping of semantic register address -> decoded value.
    """

    response = client.read_input_registers(
        address=0,
        count=7,
        device_id=PLC_DEVICE_ID,
    )

    if response.isError():
        raise RuntimeError(
            f"Failed to read PLC input registers: {response}"
        )

    values: dict[int, float] = {}

    for register, definition in INPUT_REGISTERS.items():
        offset = definition["offset"]

        raw_value = response.registers[offset]

        values[int(register)] = (
            raw_value * definition["scale"]
        )

    return values


async def send_event(
    client: httpx.AsyncClient,
    register_address: int,
    value: float,
) -> None:
    """Send one canonical telemetry event to PermiSense."""

    register = RegisterAddress(register_address)
    definition = INPUT_REGISTERS[register]

    event = {
        "event_id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "modbus",
        "event_type": "sensor_update",
        "asset_id": ASSET_ID,
        "asset_type": ASSET_TYPE,
        "source_address": f"{PLC_HOST}:{PLC_PORT}",
        "destination_address": "permisense-backend",
        "protocol": "modbus_tcp",
        "command": "read_input_registers",
        "register_address": register_address,
        "value": value,
        "unit": definition["unit"],
        "process_id": PROCESS_ID,
        "severity": "info",
        "metadata": {
            "device_id": PLC_DEVICE_ID,
            "gateway": "modbus_gateway",
        },
    }

    response = await client.post(
        f"{BACKEND_URL}/api/telemetry/events",
        json=event,
    )

    response.raise_for_status()


async def run_gateway() -> None:
    """Continuously collect PLC telemetry and send it to PermiSense."""

    plc_client = ModbusTcpClient(
        PLC_HOST,
        port=PLC_PORT,
    )

    logger.info(
        "Connecting to Virtual PLC at %s:%s",
        PLC_HOST,
        PLC_PORT,
    )

    if not plc_client.connect():
        raise RuntimeError(
            "Could not connect to Virtual PLC"
        )

    logger.info("Connected to Virtual PLC")

    async with httpx.AsyncClient(
        timeout=5.0
    ) as backend_client:

        try:
            while True:
                values = read_process_registers(
                    plc_client
                )

                for register_address, value in values.items():
                    await send_event(
                        backend_client,
                        register_address,
                        value,
                    )

                logger.info(
                    "Telemetry cycle: %d registers sent",
                    len(values),
                )

                await asyncio.sleep(POLL_INTERVAL)

        finally:
            plc_client.close()
            logger.info("Disconnected from Virtual PLC")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )

    asyncio.run(run_gateway())
