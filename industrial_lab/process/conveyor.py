"""
PermiSense Virtual Industrial Cell - Conveyor Process Model

This module models the physical behavior of a conveyor-driven
manufacturing cell.

Important:
- This is a deterministic simulation.
- It does NOT perform cybersecurity detection.
- It does NOT generate fake security alerts.
- It consumes PLC control state and produces process state.
"""

from dataclasses import dataclass

from industrial_lab.plc.state import (
    OperatingMode,
    PLCState,
    ProcessState,
)


@dataclass
class ConveyorProcess:
    """
    Deterministic conveyor process model.

    Time is advanced explicitly through `step(dt)`.
    """

    # Physical/simulation constants
    max_speed: float = 100.0
    base_load: float = 20.0
    load_per_speed: float = 0.45
    load_per_target: float = 0.35

    # Production model
    production_interval: float = 60.0 / 18.0

    # Internal process state
    production_timer: float = 0.0

    def reset(self) -> None:
        """Reset internal process timing."""
        self.production_timer = 0.0

    def step(self, state: PLCState, dt: float) -> None:
        """
        Advance the physical process by `dt` seconds.

        The PLCState acts as the controller-facing state.
        This function updates the process telemetry fields.
        """

        if dt <= 0:
            raise ValueError("dt must be greater than zero")

        # --------------------------------------------------
        # 1. Determine whether the motor can run
        # --------------------------------------------------
        motor_running = (
            state.motor_enable == 1
            and state.operating_mode == OperatingMode.RUN
            and state.jam_state == 0
        )

        # --------------------------------------------------
        # 2. Determine target speed
        # --------------------------------------------------
        target_speed = (
            state.speed_setpoint
            if motor_running
            else 0.0
        )

        # Keep the target physically bounded.
        target_speed = max(
            0.0,
            min(self.max_speed, target_speed),
        )

        # --------------------------------------------------
        # 3. Apply acceleration limit
        # --------------------------------------------------
        max_delta = state.acceleration_limit * dt

        if state.actual_speed < target_speed:
            state.actual_speed = min(
                state.actual_speed + max_delta,
                target_speed,
            )
        elif state.actual_speed > target_speed:
            state.actual_speed = max(
                state.actual_speed - max_delta,
                target_speed,
            )

        # --------------------------------------------------
        # 4. Calculate motor load
        # --------------------------------------------------
        speed_load = self.load_per_speed * state.actual_speed
        production_load = self.load_per_target * state.production_target

        calculated_load = (
            self.base_load
            + speed_load
            + production_load
        )

        # Motor load is bounded to the simulated physical range.
        state.motor_load = max(
            0.0,
            min(100.0, calculated_load),
        )

        # --------------------------------------------------
        # 5. Calculate motor current
        # --------------------------------------------------
        # Simple deterministic relationship:
        # higher mechanical load -> higher current.
        state.motor_current = (
            2.0 + (state.motor_load * 0.08)
        )

        # --------------------------------------------------
        # 6. Advance conveyor position
        # --------------------------------------------------
        if state.actual_speed > 0:
            state.position += (
                state.actual_speed / self.max_speed
            ) * dt * 10.0

        # Keep position normalized to 0-100%.
        state.position %= 100.0

        # --------------------------------------------------
        # 7. Production
        # --------------------------------------------------
        if motor_running and state.actual_speed > 1.0:
            self.production_timer += dt

            target = max(
                0.1,
                state.production_target,
            )

            production_interval = 60.0 / target

            while self.production_timer >= production_interval:
                self.production_timer -= production_interval
                state.workpieces_processed += 1
        else:
            self.production_timer = 0.0

        # --------------------------------------------------
        # 8. Determine process state
        # --------------------------------------------------
        if state.jam_state:
            state.process_state = ProcessState.JAMMED

        elif state.motor_enable == 0:
            state.process_state = ProcessState.STOPPED

        elif state.operating_mode == OperatingMode.STOP:
            state.process_state = ProcessState.STOPPED

        elif state.actual_speed < state.speed_setpoint:
            state.process_state = ProcessState.STARTING

        else:
            state.process_state = ProcessState.RUNNING

        # --------------------------------------------------
        # 9. Overspeed protection indicator
        # --------------------------------------------------
        if state.actual_speed > state.overspeed_limit:
            state.process_state = ProcessState.DEGRADED

        # --------------------------------------------------
        # 10. High-load condition
        # --------------------------------------------------
        if state.motor_load > state.high_load_limit:
            state.process_state = ProcessState.DEGRADED
