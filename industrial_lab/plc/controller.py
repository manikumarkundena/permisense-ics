"""
PermiSense Virtual PLC Controller

Owns the single authoritative PLCState shared by:
- Modbus/TCP interface
- Process simulator
- Future telemetry collection
"""

from industrial_lab.plc.state import PLCState, create_default_state


class VirtualPLC:
    """Authoritative virtual PLC."""

    def __init__(self) -> None:
        self.state: PLCState = create_default_state()

    def reset(self) -> None:
        """Reset the PLC to its default process state."""
        self.state = create_default_state()
