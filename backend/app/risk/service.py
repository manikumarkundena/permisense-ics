from uuid import uuid4

from app.risk.schemas import RiskAssessment, RiskLevel
from app.schemas.events import Severity


# The score is intentionally decomposed into bounded, explainable factors.
# The factor weights sum to 100; the final score is never an arbitrary constant.
SEVERITY_WEIGHT = {
    Severity.INFO: 10,
    Severity.LOW: 20,
    Severity.MEDIUM: 30,
    Severity.HIGH: 40,
    Severity.CRITICAL: 50,
}

CONTROL_WEIGHT = 15
IMPACT_WEIGHT = 20
DEVIATION_WEIGHT = 10
CORRELATION_WEIGHT = 5


def _factor(name: str, contributed: float, weight: float, reason: str) -> dict:
    return {
        "name": name,
        "contributed": round(max(0.0, min(contributed, weight)), 2),
        "weight": weight,
        "reason": reason,
    }


def assess_operational_risk(
    *,
    severity: Severity,
    control_manipulation: bool,
    process_impact: bool,
    process_value: float | None = None,
    process_threshold: float | None = None,
    impact_type: str | None = None,
    correlation_seconds: float | None = None,
) -> RiskAssessment:
    severity_factor = float(SEVERITY_WEIGHT[severity])
    control_factor = float(CONTROL_WEIGHT if control_manipulation else 0)
    impact_factor = float(IMPACT_WEIGHT if process_impact else 0)

    deviation_factor = 0.0
    if process_value is not None and process_threshold is not None:
        threshold = float(process_threshold)
        value = float(process_value)
        if threshold > 0 and value > threshold:
            deviation_ratio = (value - threshold) / threshold
            deviation_factor = min(DEVIATION_WEIGHT, deviation_ratio * 50.0)
    elif impact_type in {"process_stopped", "process_jam"}:
        deviation_factor = DEVIATION_WEIGHT

    correlation_factor = 0.0
    if correlation_seconds is not None:
        correlation_factor = max(
            0.0,
            min(
                CORRELATION_WEIGHT,
                CORRELATION_WEIGHT * (1.0 - float(correlation_seconds) / 30.0),
            ),
        )

    score = round(
        min(
            100.0,
            severity_factor
            + control_factor
            + impact_factor
            + deviation_factor
            + correlation_factor,
        )
    )

    if score >= 90:
        level = RiskLevel.CRITICAL
    elif score >= 70:
        level = RiskLevel.HIGH
    elif score >= 40:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.LOW

    factors = [
        _factor(
            "severity_base",
            severity_factor,
            50,
            f"{severity.value.upper()} severity contributes {severity_factor:g} of 50 available points.",
        ),
        _factor(
            "control_manipulation",
            control_factor,
            CONTROL_WEIGHT,
            "A PLC control register was changed and correlated with the incident."
            if control_manipulation
            else "No control manipulation was established.",
        ),
        _factor(
            "process_impact",
            impact_factor,
            IMPACT_WEIGHT,
            "A physical/process deviation was observed in telemetry."
            if process_impact
            else "No physical/process impact was established.",
        ),
        _factor(
            "deviation_magnitude",
            deviation_factor,
            DEVIATION_WEIGHT,
            (
                f"Observed value {float(process_value):g} exceeded bound "
                f"{float(process_threshold):g}."
                if process_value is not None and process_threshold is not None
                else (
                    "The process entered a stopped/jammed state."
                    if impact_type in {"process_stopped", "process_jam"}
                    else "No numeric deviation magnitude was available."
                )
            ),
        ),
        _factor(
            "temporal_correlation",
            correlation_factor,
            CORRELATION_WEIGHT,
            (
                f"The process deviation followed the control change by "
                f"{float(correlation_seconds):.2f}s."
                if correlation_seconds is not None
                else "No precise control-to-process delay was available."
            ),
        ),
    ]

    rationale = (
        f"Operational risk is {level.value} at {score}/100. "
        f"The score combines severity ({severity_factor:g}/50), "
        f"control manipulation ({control_factor:g}/15), process impact "
        f"({impact_factor:g}/20), deviation magnitude ({deviation_factor:g}/10), "
        f"and temporal correlation ({correlation_factor:g}/5)."
    )

    return RiskAssessment(
        risk_id=str(uuid4()),
        level=level,
        score=score,
        factors=factors,
        rationale=rationale,
    )
