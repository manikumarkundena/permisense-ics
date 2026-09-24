from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.events import Severity


class CorrelationResult(BaseModel):
    correlation_id: str
    asset_id: str
    process_id: str | None
    timestamp: datetime
    severity: Severity
    title: str
    reason: str
    event_ids: list[str]
    detection_ids: list[str]
    mitre_mappings: list[dict] = Field(default_factory=list)
    impact: dict | None = None
    risk: dict | None = None
    evidence_graph: dict | None = None
    evidence: dict = Field(default_factory=dict)
