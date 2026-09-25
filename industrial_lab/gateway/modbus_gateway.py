"""
PermiSense Modbus Telemetry Gateway.

Reads process telemetry from the virtual PLC over Modbus/TCP
and converts it into canonical PermiSense events.

The gateway does NOT perform detection.
"""

import asyncio
import logging
import os
from datetime import datetime, timezone
from uuid import uuid4

import httpx
from pymodbus.client import ModbusTcpClient

from industrial_lab.plc.registers import RegisterAddress


logger = logging.getLogger("permisense.gateway")


PLC_HOST = os.getenv("MODBUS_HOST", "127.0.0.1")
PLC_PORT = int(os.getenv("MODBUS_PORT", "5020"))
PLC_DEVICE_ID = 1

API_PORT = os.getenv("PORT", "8000")
BACKEND_URL = os.getenv(
    "BACKEND_URL",
    f"http://127.0.0.1:{API_PORT}",
).rstrip("/")

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


# Writable control registers observed by the security telemetry gateway.
#
# The gateway polls the PLC state independently of the attack simulator.
# A value transition is emitted as CONTROL_WRITE telemetry. This is an
# observation mechanism, not a detection mechanism.
CONTROL_REGISTERS = {
    RegisterAddress.MOTOR_ENABLE: {
        "offset": 0,
        "unit": None,
        "scale": 1.0,
    },
    RegisterAddress.OPERATING_MODE: {
        "offset": 1,
        "unit": None,
        "scale": 1.0,
    },
    RegisterAddress.SPEED_SETPOINT: {
        "offset": 2,
        "unit": "percent",
        "scale": 0.1,
    },
    RegisterAddress.ACCELERATION_LIMIT: {
        "offset": 3,
        "unit": "percent_per_second",
        "scale": 0.1,
    },
    RegisterAddress.PRODUCTION_TARGET: {
        "offset": 4,
        "unit": "parts_per_minute",
        "scale": 0.1,
    },
    RegisterAddress.RESET_COMMAND: {
        "offset": 5,
        "unit": None,
        "scale": 1.0,
    },
    RegisterAddress.OVERSPEED_LIMIT: {
        "offset": 9,
        "unit": "percent",
        "scale": 0.1,
    },
    RegisterAddress.HIGH_LOAD_LIMIT: {
        "offset": 10,
        "unit": "percent",
        "scale": 0.1,
    },
    RegisterAddress.JAM_TIMEOUT: {
        "offset": 11,
        "unit": "seconds",
        "scale": 0.1,
    },
    RegisterAddress.CONFIG_VERSION: {
        "offset": 12,
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


def read_control_registers(
    client: ModbusTcpClient,
) -> dict[int, float]:
    """
    Read writable PLC control/configuration registers.

    The gateway observes the PLC state through Modbus/TCP. It does not
    call detection or correlation code; it only produces canonical
    control-write telemetry when a value changes.
    """
    values: dict[int, float] = {}

    responses = (
        (0, 6),
        (9, 4),
    )

    for start, count in responses:
        response = client.read_holding_registers(
            address=start,
            count=count,
            device_id=PLC_DEVICE_ID,
        )

        if response.isError():
            raise RuntimeError(
                "Failed to read PLC holding registers: "
                f"start={start}, count={count}, response={response}"
            )

        for register, definition in CONTROL_REGISTERS.items():
            offset = definition["offset"]

            if start <= offset < start + count:
                raw_value = response.registers[offset - start]
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


def detect_control_changes(
    previous: dict[int, float] | None,
    current: dict[int, float],
) -> list[tuple[int, float, float]]:
    """
    Return control-register transitions observed between two polls.

    The first poll establishes a baseline and therefore produces no
    change events.
    """
    if previous is None:
        return []

    changes = []

    for register_address, value in current.items():
        previous_value = previous.get(register_address)

        if previous_value is not None and value != previous_value:
            changes.append(
                (
                    register_address,
                    previous_value,
                    value,
                )
            )

    return changes


async def send_control_change(
    client: httpx.AsyncClient,
    register_address: int,
    previous_value: float,
    value: float,
) -> None:
    """Send an observed PLC control-register change as canonical telemetry."""
    register = RegisterAddress(register_address)
    definition = CONTROL_REGISTERS[register]

    event = {
        "event_id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "modbus",
        "event_type": "control_write",
        "asset_id": ASSET_ID,
        "asset_type": ASSET_TYPE,
        "source_address": f"{PLC_HOST}:{PLC_PORT}",
        "destination_address": "permisense-backend",
        "protocol": "modbus_tcp",
        "command": "observed_holding_register_change",
        "register_address": register_address,
        "previous_value": previous_value,
        "value": value,
        "unit": definition["unit"],
        "process_id": PROCESS_ID,
        "severity": "info",
        "metadata": {
            "device_id": PLC_DEVICE_ID,
            "gateway": "modbus_gateway",
            "observation_method": "polling",
            "observation_note": (
                "A control-register value changed between gateway polls; "
                "the gateway does not infer attacker identity."
            ),
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

        previous_controls: dict[int, float] | None = None

        try:
            while True:
                values = read_process_registers(
                    plc_client
                )

                control_values = read_control_registers(
                    plc_client
                )

                for register_address, value in values.items():
                    await send_event(
                        backend_client,
                        register_address,
                        value,
                    )

                control_changes = 0

                for (
                    register_address,
                    previous_value,
                    value,
                ) in detect_control_changes(
                    previous_controls,
                    control_values,
                ):
                    await send_control_change(
                        backend_client,
                        register_address,
                        previous_value,
                        value,
                    )
                    control_changes += 1

                previous_controls = control_values

                logger.info(
                    "Telemetry cycle: %d process registers sent, "
                    "%d control changes observed",
                    len(values),
                    control_changes,
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
