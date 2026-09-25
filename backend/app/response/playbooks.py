from dataclasses import dataclass


@dataclass(frozen=True)
class ResponsePlaybook:
    action: str
    description: str
    register_address: int
    target_label: str
    verification_register: int | None
    verification_type: str


# Every automated response must be explicitly allowlisted here.
# Targets are resolved from the observed control event's previous value.
PLAYBOOKS: dict[int, ResponsePlaybook] = {
    40001: ResponsePlaybook(
        "restore_motor_enable",
        "Restore the motor-enable value observed before the control change.",
        40001,
        "previous value",
        30001,
        "speed",
    ),
    40002: ResponsePlaybook(
        "restore_operating_mode",
        "Restore the PLC operating mode observed before the control change.",
        40002,
        "previous value",
        30007,
        "process_state",
    ),
    40003: ResponsePlaybook(
        "restore_speed_setpoint",
        "Restore the conveyor speed setpoint observed before the control change.",
        40003,
        "previous value",
        30001,
        "speed",
    ),
    40004: ResponsePlaybook(
        "restore_acceleration_limit",
        "Restore the acceleration limit observed before the control change.",
        40004,
        "previous value",
        30001,
        "speed",
    ),
    40005: ResponsePlaybook(
        "restore_production_target",
        "Restore the production target observed before the control change.",
        40005,
        "previous value",
        30005,
        "workpieces",
    ),
    40010: ResponsePlaybook(
        "restore_overspeed_limit",
        "Restore the overspeed threshold observed before the control change.",
        40010,
        "previous value",
        30001,
        "speed",
    ),
    40011: ResponsePlaybook(
        "restore_high_load_limit",
        "Restore the high-load threshold observed before the control change.",
        40011,
        "previous value",
        30003,
        "load",
    ),
    40012: ResponsePlaybook(
        "restore_jam_timeout",
        "Restore the jam timeout observed before the control change.",
        40012,
        "previous value",
        30006,
        "jam",
    ),
    40013: ResponsePlaybook(
        "restore_config_version",
        "Restore the PLC configuration version observed before the control change.",
        40013,
        "previous value",
        None,
        "control",
    ),
}


def get_playbook(register_address: int | None) -> ResponsePlaybook | None:
    if register_address is None:
        return None
    return PLAYBOOKS.get(register_address)
