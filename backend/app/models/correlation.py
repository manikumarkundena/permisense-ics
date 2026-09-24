from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Correlation(Base):
    __tablename__ = "correlations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    correlation_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    control_event_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    asset_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    process_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )

    reason: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    event_ids_json: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    detection_ids_json: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    evidence_json: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
