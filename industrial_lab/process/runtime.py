"""
PermiSense Virtual Industrial Cell - Process Runtime
"""

import asyncio
import logging

from industrial_lab.plc.controller import VirtualPLC
from industrial_lab.process.conveyor import ConveyorProcess


logger = logging.getLogger("permisense.process")


class ProcessRuntime:
    """Continuously advances the virtual manufacturing process."""

    def __init__(
        self,
        plc: VirtualPLC,
        tick_seconds: float = 0.1,
    ):
        if tick_seconds <= 0:
            raise ValueError("tick_seconds must be greater than zero")

        self.plc = plc
        self.tick_seconds = tick_seconds
        self.process = ConveyorProcess()
        self.running = False

    async def run(self) -> None:
        """Run the process simulation continuously."""
        self.running = True

        logger.info("Virtual manufacturing process started")

        while self.running:
            self.process.step(
                self.plc.state,
                self.tick_seconds,
            )

            await asyncio.sleep(self.tick_seconds)

    def stop(self) -> None:
        """Stop the process runtime."""
        self.running = False
