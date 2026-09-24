from industrial_lab.plc.controller import VirtualPLC


def test_virtual_plc_owns_state():
    plc = VirtualPLC()

    assert plc.state.speed_setpoint == 50.0
    assert plc.state.actual_speed == 0.0


def test_virtual_plc_reset():
    plc = VirtualPLC()

    plc.state.speed_setpoint = 80.0
    plc.state.actual_speed = 60.0

    plc.reset()

    assert plc.state.speed_setpoint == 50.0
    assert plc.state.actual_speed == 0.0
