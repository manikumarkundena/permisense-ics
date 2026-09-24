from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.events import Severity


class DetectionResult(BaseModel):
    detection_id: str
    event_id: str
    rule_id: str
    timestamp: datetime
    asset_id: str
    severity: Severity
    title: str
    reason: str
    evidence: dict = Field(default_factory=dict)
