from industrial_lab.plc.state import (
    OperatingMode,
    ProcessState,
    create_default_state,
)
from industrial_lab.process.conveyor import ConveyorProcess


def test_conveyor_accelerates_towards_setpoint():
    state = create_default_state()
    process = ConveyorProcess()

    assert state.actual_speed == 0.0

    process.step(state, 1.0)

    # Default acceleration limit = 20%/s
    assert state.actual_speed == 20.0

    process.step(state, 1.0)

    assert state.actual_speed == 40.0

    process.step(state, 1.0)

    assert state.actual_speed == 50.0


def test_motor_disabled_stops_process():
    state = create_default_state()
    process = ConveyorProcess()

    state.actual_speed = 50.0
    state.motor_enable = 0

    process.step(state, 1.0)

    assert state.actual_speed == 30.0
    assert state.process_state == ProcessState.STOPPED


def test_operating_mode_stop_stops_target():
    state = create_default_state()
    process = ConveyorProcess()

    state.actual_speed = 50.0
    state.operating_mode = OperatingMode.STOP

    process.step(state, 1.0)

    assert state.actual_speed == 30.0
    assert state.process_state == ProcessState.STOPPED


def test_speed_setpoint_change_affects_process():
    state = create_default_state()
    process = ConveyorProcess()

    state.speed_setpoint = 80.0

    process.step(state, 1.0)

    assert state.actual_speed == 20.0

    process.step(state, 1.0)

    assert state.actual_speed == 40.0


def test_process_generates_production():
    state = create_default_state()
    process = ConveyorProcess()

    state.actual_speed = 50.0

    # 18 parts/minute => one part every 3.333 seconds.
    for _ in range(4):
        process.step(state, 1.0)

    assert state.workpieces_processed >= 1


def test_load_and_current_are_deterministic():
    state = create_default_state()
    process = ConveyorProcess()

    state.actual_speed = 50.0

    process.step(state, 1.0)

    assert state.motor_load > 0
    assert state.motor_current > 0


def test_overspeed_causes_degraded_state():
    state = create_default_state()
    process = ConveyorProcess()

    state.speed_setpoint = 90.0
    state.overspeed_limit = 80.0

    # Reach 90%.
    for _ in range(5):
        process.step(state, 1.0)

    assert state.actual_speed == 90.0
    assert state.process_state == ProcessState.DEGRADED
