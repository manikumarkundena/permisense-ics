from app.api.response import (
    ACTUAL_SPEED_OFFSET,
    PLC_DEVICE_ID,
    SAFE_SPEED_SETPOINT,
    SAFE_SPEED_THRESHOLD,
    SPEED_OFFSET,
    SPEED_REGISTER,
    ApprovalRequest,
)


def test_safe_response_contract():
    request = ApprovalRequest(action="set_safe_speed", approved_by="operator")

    assert request.action == "set_safe_speed"
    assert SAFE_SPEED_SETPOINT == 50.0
    assert SAFE_SPEED_THRESHOLD == 80.0
    assert SPEED_REGISTER == 40003
    assert SPEED_OFFSET == 2
    assert ACTUAL_SPEED_OFFSET == 0
    assert PLC_DEVICE_ID == 1
