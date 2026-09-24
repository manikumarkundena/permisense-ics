"""
PermiSense Virtual PLC - Modbus/TCP Server

Runs the protocol-facing virtual PLC.

The VirtualPLC owns the authoritative PLCState.
The process runtime operates on the same state.
"""

import asyncio
import logging
from functools import partial

from pymodbus.server import StartAsyncTcpServer
from pymodbus.simulator.simdata import DataType, SimData
from pymodbus.simulator.simdevice import SimDevice

from industrial_lab.plc.controller import VirtualPLC
from industrial_lab.plc.modbus_adapter import modbus_action
from industrial_lab.process.runtime import ProcessRuntime


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger("permisense.plc")


HOST = "127.0.0.1"
PORT = 5020


def build_device(plc: VirtualPLC) -> SimDevice:
    """
    Construct the virtual PLC register space.

    Holding registers:
        offsets 0-5  -> 40001-40006
        offsets 6-8  -> reserved
        offsets 9-12 -> 40010-40013

    Input registers:
        offsets 0-6 -> 30001-30007
    """

    holding_registers = [
        SimData(
            address=0,
            count=6,
            values=0,
            datatype=DataType.UINT16,
            readonly=False,
        ),
        SimData(
            address=9,
            count=4,
            values=0,
            datatype=DataType.UINT16,
            readonly=False,
        ),
    ]

    input_registers = [
        SimData(
            address=0,
            count=7,
            values=0,
            datatype=DataType.UINT16,
            readonly=True,
        )
    ]

    action = partial(
        modbus_action,
        plc_state=plc.state,
    )

    return SimDevice(
        id=1,
        simdata=(
            [
                SimData(
                    address=0,
                    count=1,
                    values=False,
                    datatype=DataType.BITS,
                )
            ],
            [
                SimData(
                    address=0,
                    count=1,
                    values=False,
                    datatype=DataType.BITS,
                )
            ],
            holding_registers,
            input_registers,
        ),
        action=action,
    )


async def run_server() -> None:
    """Start the virtual PLC and process runtime."""

    plc = VirtualPLC()

    process_runtime = ProcessRuntime(
        plc=plc,
        tick_seconds=0.1,
    )

    logger.info("Starting PermiSense Virtual PLC")
    logger.info(
        "Modbus/TCP endpoint: %s:%s",
        HOST,
        PORT,
    )
    logger.info(
        "Initial SPEED_SETPOINT: %.1f%%",
        plc.state.speed_setpoint,
    )

    device = build_device(plc)

    process_task = asyncio.create_task(
        process_runtime.run()
    )

    try:
        await StartAsyncTcpServer(
            context=device,
            address=(HOST, PORT),
        )
    finally:
        process_runtime.stop()
        process_task.cancel()

        try:
            await process_task
        except asyncio.CancelledError:
            pass


if __name__ == "__main__":
    try:
        asyncio.run(run_server())
    except KeyboardInterrupt:
        logger.info("Virtual PLC stopped")
