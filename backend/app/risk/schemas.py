from enum import Enum

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskAssessment(BaseModel):
    risk_id: str
    level: RiskLevel
    score: int = Field(ge=0, le=100)
    factors: list[dict]
    rationale: str
