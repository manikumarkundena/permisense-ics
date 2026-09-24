from uuid import uuid4

from app.risk.schemas import RiskAssessment, RiskLevel
from app.schemas.events import Severity


SEVERITY_BASE = {
    Severity.INFO: 10,
    Severity.LOW: 25,
    Severity.MEDIUM: 50,
    Severity.HIGH: 70,
    Severity.CRITICAL: 90,
}


def assess_operational_risk(
    *,
    severity: Severity,
    control_manipulation: bool,
    process_impact: bool,
) -> RiskAssessment:
    base = SEVERITY_BASE[severity]
    control_factor = 15 if control_manipulation else 0
    impact_factor = 20 if process_impact else 0

    score = min(100, base + control_factor + impact_factor)

    if score >= 90:
        level = RiskLevel.CRITICAL
    elif score >= 70:
        level = RiskLevel.HIGH
    elif score >= 40:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.LOW

    factors = {
        "severity_base": base,
        "control_manipulation": control_factor,
        "process_impact": impact_factor,
    }

    rationale = (
        f"Operational risk is {level.value} because the observed "
        f"event severity contributes {base} points, control manipulation "
        f"contributes {control_factor}, and demonstrated process impact "
        f"contributes {impact_factor}."
    )

    return RiskAssessment(
        risk_id=str(uuid4()),
        level=level,
        score=score,
        factors=factors,
        rationale=rationale,
    )
