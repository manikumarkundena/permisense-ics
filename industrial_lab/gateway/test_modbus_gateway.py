from industrial_lab.gateway.modbus_gateway import detect_control_changes


def test_first_poll_establishes_baseline():
    assert detect_control_changes(
        None,
        {40003: 50.0},
    ) == []


def test_control_change_is_observed():
    assert detect_control_changes(
        {40003: 50.0},
        {40003: 90.0},
    ) == [
        (40003, 50.0, 90.0),
    ]


def test_unchanged_control_is_ignored():
    assert detect_control_changes(
        {40003: 50.0},
        {40003: 50.0},
    ) == []


def test_multiple_control_changes_are_observed():
    assert detect_control_changes(
        {
            40003: 50.0,
            40010: 80.0,
        },
        {
            40003: 90.0,
            40010: 70.0,
        },
    ) == [
        (40003, 50.0, 90.0),
        (40010, 80.0, 70.0),
    ]
