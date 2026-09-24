MITRE_ICS_MAPPING = {
    "ICS-CONTROL-WRITE": {
        "technique_id": "T1692.001",
        "technique_name": "Unauthorized Message: Command Message",
        "tactic": "Impair Process Control",
        "basis": "A control write is represented as an ICS command message.",
    },
}


REGISTER_MAPPINGS = {
    40002: {
        "technique_id": "T0858",
        "technique_name": "Change Operating Mode",
        "tactic": "Execution, Evasion",
        "basis": "The event writes the PLC operating-mode register.",
    },
    40003: {
        "technique_id": "T0831",
        "technique_name": "Manipulation of Control",
        "tactic": "Impact",
        "basis": "The event changes the conveyor speed setpoint.",
    },
    40004: {
        "technique_id": "T0831",
        "technique_name": "Manipulation of Control",
        "tactic": "Impact",
        "basis": "The event changes a process-control acceleration parameter.",
    },
    40005: {
        "technique_id": "T0831",
        "technique_name": "Manipulation of Control",
        "tactic": "Impact",
        "basis": "The event changes a process-control production target.",
    },
}


def get_mitre_mapping(rule_id: str) -> dict | None:
    mapping = MITRE_ICS_MAPPING.get(rule_id)
    return dict(mapping) if mapping else None


def get_mitre_mappings(rule_id: str, register_address: int | None) -> list[dict]:
    mappings: list[dict] = []

    primary = get_mitre_mapping(rule_id)
    if primary:
        mappings.append(primary)

    register_mapping = REGISTER_MAPPINGS.get(register_address)
    if register_mapping and not any(
        item["technique_id"] == register_mapping["technique_id"]
        for item in mappings
    ):
        mappings.append(dict(register_mapping))

    return mappings
