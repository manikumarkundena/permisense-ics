from app.api.response import (
    CONTROL_OFFSETS,
    CONTROL_SCALES,
    PLC_DEVICE_ID,
)
from app.response.playbooks import get_playbook


def test_register_specific_response_playbooks():
    speed = get_playbook(40003)
    assert speed is not None
    assert speed.action == "restore_speed_setpoint"
    assert speed.register_address == 40003
    assert speed.verification_register == 30001

    mode = get_playbook(40002)
    assert mode is not None
    assert mode.action == "restore_operating_mode"
    assert mode.verification_register == 30007


def test_response_register_contract():
    assert CONTROL_OFFSETS[40003] == 2
    assert CONTROL_OFFSETS[40010] == 9
    assert CONTROL_SCALES[40003] == 10.0
    assert CONTROL_SCALES[40001] == 1.0
    assert PLC_DEVICE_ID == 1
