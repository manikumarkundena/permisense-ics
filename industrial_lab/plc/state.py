"""
PermiSense Virtual PLC - State Model

Maintains the current state of PLC control/configuration values
and read-only process telemetry.
"""

from dataclasses import dataclass
from enum import IntEnum

from industrial_lab.plc.registers import RegisterAddress


class OperatingMode(IntEnum):
    STOP = 0
    RUN = 1
    PROGRAM = 2


class ProcessState(IntEnum):
    STOPPED = 0
    STARTING = 1
    RUNNING = 2
    DEGRADED = 3
    JAMMED = 4
    FAULT = 5


@dataclass
class PLCState:
    # Control state
    motor_enable: int = 1
    operating_mode: int = OperatingMode.RUN
    speed_setpoint: float = 50.0
    acceleration_limit: float = 20.0
    production_target: float = 18.0
    reset_command: int = 0

    # Alarm/configuration state
    overspeed_limit: float = 80.0
    high_load_limit: float = 80.0
    jam_timeout: float = 5.0
    config_version: int = 1

    # Process telemetry
    actual_speed: float = 0.0
    motor_current: float = 0.0
    motor_load: float = 0.0
    position: float = 0.0
    workpieces_processed: int = 0
    jam_state: int = 0
    process_state: int = ProcessState.STOPPED

    def reset_process(self) -> None:
        """Reset transient process values to a safe initial state."""
        self.motor_enable = 1
        self.operating_mode = OperatingMode.RUN
        self.speed_setpoint = 50.0
        self.actual_speed = 0.0
        self.motor_current = 0.0
        self.motor_load = 0.0
        self.position = 0.0
        self.workpieces_processed = 0
        self.jam_state = 0
        self.process_state = ProcessState.STOPPED

    def get_value(self, address: int) -> int:
        """
        Return a PLC register value.

        Modbus registers contain integers, so floating-point
        process values use fixed-point scaling.
        """
        register = RegisterAddress(address)

        if register == RegisterAddress.MOTOR_ENABLE:
            return self.motor_enable

        if register == RegisterAddress.OPERATING_MODE:
            return int(self.operating_mode)

        if register == RegisterAddress.SPEED_SETPOINT:
            return round(self.speed_setpoint * 10)

        if register == RegisterAddress.ACCELERATION_LIMIT:
            return round(self.acceleration_limit * 10)

        if register == RegisterAddress.PRODUCTION_TARGET:
            return round(self.production_target * 10)

        if register == RegisterAddress.RESET_COMMAND:
            return self.reset_command

        if register == RegisterAddress.OVERSPEED_LIMIT:
            return round(self.overspeed_limit * 10)

        if register == RegisterAddress.HIGH_LOAD_LIMIT:
            return round(self.high_load_limit * 10)

        if register == RegisterAddress.JAM_TIMEOUT:
            return round(self.jam_timeout * 10)

        if register == RegisterAddress.CONFIG_VERSION:
            return self.config_version

        if register == RegisterAddress.ACTUAL_SPEED:
            return round(self.actual_speed * 10)

        if register == RegisterAddress.MOTOR_CURRENT:
            return round(self.motor_current * 10)

        if register == RegisterAddress.MOTOR_LOAD:
            return round(self.motor_load * 10)

        if register == RegisterAddress.POSITION:
            return round(self.position * 10)

        if register == RegisterAddress.WORKPIECES_PROCESSED:
            return self.workpieces_processed

        if register == RegisterAddress.JAM_STATE:
            return self.jam_state

        if register == RegisterAddress.PROCESS_STATE:
            return int(self.process_state)

        raise ValueError(f"Unsupported register: {address}")

    def set_value(self, address: int, value: int) -> None:
        """
        Update a writable PLC register.

        Validation is performed here so every interface follows
        the same PLC state rules.
        """
        register = RegisterAddress(address)

        if register == RegisterAddress.MOTOR_ENABLE:
            if value not in (0, 1):
                raise ValueError("MOTOR_ENABLE must be 0 or 1")
            self.motor_enable = value
            return

        if register == RegisterAddress.OPERATING_MODE:
            if value not in [mode.value for mode in OperatingMode]:
                raise ValueError(f"Invalid operating mode: {value}")
            self.operating_mode = OperatingMode(value)
            return

        if register == RegisterAddress.SPEED_SETPOINT:
            speed = value / 10
            if not 0 <= speed <= 100:
                raise ValueError("SPEED_SETPOINT must be between 0 and 100")
            self.speed_setpoint = speed
            return

        if register == RegisterAddress.ACCELERATION_LIMIT:
            acceleration = value / 10
            if not 0 < acceleration <= 100:
                raise ValueError(
                    "ACCELERATION_LIMIT must be greater than 0 and at most 100"
                )
            self.acceleration_limit = acceleration
            return

        if register == RegisterAddress.PRODUCTION_TARGET:
            target = value / 10
            if not 0 <= target <= 100:
                raise ValueError(
                    "PRODUCTION_TARGET must be between 0 and 100"
                )
            self.production_target = target
            return

        if register == RegisterAddress.RESET_COMMAND:
            if value not in (0, 1):
                raise ValueError("RESET_COMMAND must be 0 or 1")
            self.reset_command = value
            return

        if register == RegisterAddress.OVERSPEED_LIMIT:
            limit = value / 10
            if not 0 <= limit <= 100:
                raise ValueError("OVERSPEED_LIMIT must be between 0 and 100")
            self.overspeed_limit = limit
            return

        if register == RegisterAddress.HIGH_LOAD_LIMIT:
            limit = value / 10
            if not 0 <= limit <= 100:
                raise ValueError("HIGH_LOAD_LIMIT must be between 0 and 100")
            self.high_load_limit = limit
            return

        if register == RegisterAddress.JAM_TIMEOUT:
            timeout = value / 10
            if not 0 < timeout <= 300:
                raise ValueError("JAM_TIMEOUT must be between 0 and 300 seconds")
            self.jam_timeout = timeout
            return

        if register == RegisterAddress.CONFIG_VERSION:
            if value < 1:
                raise ValueError("CONFIG_VERSION must be >= 1")
            self.config_version = value
            return

        raise ValueError(
            f"Register {address} is read-only or unsupported"
        )


def create_default_state() -> PLCState:
    """Create a deterministic initial PLC state."""
    state = PLCState()
    state.reset_process()
    return state