import pytest
from sqlalchemy import delete, select
from datetime import datetime, timezone
from app.core.database import AsyncSessionLocal
from app.detection.repository import save_detection
from app.detection.schemas import DetectionResult
from app.models.detection import Detection
from app.schemas.events import Severity


@pytest.mark.asyncio
async def test_save_detection():
    result = DetectionResult(
        detection_id="det-db-test-001",
        event_id="evt-db-test-001",
        rule_id="ICS-CONTROL-WRITE",
        timestamp=datetime(
            2026,
            9,
            24,
            tzinfo=timezone.utc,
        ),
        asset_id="PLC-01",
        severity=Severity.HIGH,
        title="Industrial control write detected",
        reason="A control register write was observed.",
        evidence={
            "register_address": 40003,
            "value": 900,
        },
    )

    async with AsyncSessionLocal() as session:
        await session.execute(
            delete(Detection).where(
                Detection.detection_id == result.detection_id
            )
        )
        await session.commit()

        saved = await save_detection(
            session,
            result,
        )

        assert saved.detection_id == "det-db-test-001"
        assert saved.event_id == "evt-db-test-001"
        assert saved.asset_id == "PLC-01"
        assert saved.rule_id == "ICS-CONTROL-WRITE"
        assert saved.severity == "high"
        assert saved.evidence_json == {
            "register_address": 40003,
            "value": 900,
        }

        stored_result = await session.execute(
            select(Detection).where(
                Detection.detection_id == result.detection_id
            )
        )

        stored = stored_result.scalar_one()

        assert stored.detection_id == result.detection_id

        await session.delete(stored)
        await session.commit()
