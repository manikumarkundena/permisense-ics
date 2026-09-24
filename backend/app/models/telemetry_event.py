from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Float, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    event_id: Mapped[str] = mapped_column(
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

    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    asset_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    asset_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    source_address: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    destination_address: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    protocol: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    command: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    register_address: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    previous_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    unit: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    process_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="info",
    )

    metadata_json: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
