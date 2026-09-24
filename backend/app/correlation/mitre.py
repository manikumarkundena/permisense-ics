MITRE_ICS_MAPPING = {
    "ICS-CONTROL-WRITE": {
        "technique_id": "T1692.001",
        "technique_name": "Unauthorized Message: Command Message",
        "tactic": "Impair Process Control",
    },
}


def get_mitre_mapping(rule_id: str) -> dict | None:
    return MITRE_ICS_MAPPING.get(rule_id)