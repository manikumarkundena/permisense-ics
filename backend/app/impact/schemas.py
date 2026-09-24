from pydantic import BaseModel
from app.schemas.events import Severity


class ProcessImpact(BaseModel):
    impact_id: str
    asset_id: str
    process_id: str | None
    severity: Severity
    impact_type: str
    title: str
    description: str
    evidence: dict