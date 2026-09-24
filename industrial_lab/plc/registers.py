"""
PermiSense Virtual PLC - Register Contract

This module defines the authoritative register map for the
virtual smart manufacturing cell.

Important:
- Writable registers represent control/configuration points.
- Read-only registers represent process telemetry.
- The addresses are simulation-specific and are NOT claimed
  to be universal vendor PLC addresses.
"""

from dataclasses import dataclass
from enum import IntEnum


class RegisterAddress(IntEnum):
    # -------------------------
    # Writable control registers
    # -------------------------
    MOTOR_ENABLE = 40001
    OPERATING_MODE = 40002
    SPEED_SETPOINT = 40003
    ACCELERATION_LIMIT = 40004
    PRODUCTION_TARGET = 40005
    RESET_COMMAND = 40006

    # -------------------------
    # Writable alarm/config registers
    # -------------------------
    OVERSPEED_LIMIT = 40010
    HIGH_LOAD_LIMIT = 40011
    JAM_TIMEOUT = 40012
    CONFIG_VERSION = 40013

    # -------------------------
    # Read-only process registers
    # -------------------------
    ACTUAL_SPEED = 30001
    MOTOR_CURRENT = 30002
    MOTOR_LOAD = 30003
    POSITION = 30004
    WORKPIECES_PROCESSED = 30005
    JAM_STATE = 30006
    PROCESS_STATE = 30007


@dataclass(frozen=True)
class RegisterDefinition:
    address: int
    name: str
    writable: bool
    unit: str | None = None
    description: str = ""


REGISTER_MAP: dict[int, RegisterDefinition] = {
    # Controls
    40001: RegisterDefinition(
        40001, "MOTOR_ENABLE", True, None,
        "Enable or disable the conveyor motor."
    ),
    40002: RegisterDefinition(
        40002, "OPERATING_MODE", True, None,
        "Current PLC operating mode."
    ),
    40003: RegisterDefinition(
        40003, "SPEED_SETPOINT", True, "percent",
        "Requested conveyor speed."
    ),
    40004: RegisterDefinition(
        40004, "ACCELERATION_LIMIT", True, "percent_per_second",
        "Maximum simulated acceleration."
    ),
    40005: RegisterDefinition(
        40005, "PRODUCTION_TARGET", True, "parts_per_minute",
        "Requested production throughput."
    ),
    40006: RegisterDefinition(
        40006, "RESET_COMMAND", True, None,
        "Reset command for recoverable process conditions."
    ),

    # Alarm/configuration
    40010: RegisterDefinition(
        40010, "OVERSPEED_LIMIT", True, "percent",
        "Configured overspeed threshold."
    ),
    40011: RegisterDefinition(
        40011, "HIGH_LOAD_LIMIT", True, "percent",
        "Configured high-load threshold."
    ),
    40012: RegisterDefinition(
        40012, "JAM_TIMEOUT", True, "seconds",
        "Time before a persistent obstruction becomes a jam."
    ),
    40013: RegisterDefinition(
        40013, "CONFIG_VERSION", True, None,
        "Virtual PLC configuration version."
    ),

    # Process telemetry
    30001: RegisterDefinition(
        30001, "ACTUAL_SPEED", False, "percent",
        "Measured conveyor speed."
    ),
    30002: RegisterDefinition(
        30002, "MOTOR_CURRENT", False, "ampere",
        "Simulated motor current."
    ),
    30003: RegisterDefinition(
        30003, "MOTOR_LOAD", False, "percent",
        "Simulated motor load."
    ),
    30004: RegisterDefinition(
        30004, "POSITION", False, "percent",
        "Normalized workpiece position."
    ),
    30005: RegisterDefinition(
        30005, "WORKPIECES_PROCESSED", False, "count",
        "Total processed workpieces."
    ),
    30006: RegisterDefinition(
        30006, "JAM_STATE", False, None,
        "1 when a simulated jam exists, otherwise 0."
    ),
    30007: RegisterDefinition(
        30007, "PROCESS_STATE", False, None,
        "Encoded process state."
    ),
}


def get_register(address: int) -> RegisterDefinition:
    """Return the definition for a register address."""
    try:
        return REGISTER_MAP[address]
    except KeyError as exc:
        raise ValueError(f"Unknown PLC register: {address}") from exc


def is_writable(address: int) -> bool:
    """Return whether a register is intentionally writable."""
    return get_register(address).writable
