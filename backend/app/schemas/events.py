from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class EventSource(str, Enum):
    MODBUS = "modbus"
    MQTT = "mqtt"
    PROCESS = "process"
    SYSTEM = "system"
    MANUAL = "manual"


class EventType(str, Enum):
    TELEMETRY = "telemetry"
    CONTROL_WRITE = "control_write"
    SENSOR_UPDATE = "sensor_update"
    NETWORK_ACTIVITY = "network_activity"
    PROCESS_STATE = "process_state"
    ALERT = "alert"


class Severity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PermiSenseEvent(BaseModel):
    """
    Canonical event flowing through the PermiSense pipeline.
    """

    event_id: str

    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    source: EventSource
    event_type: EventType

    asset_id: str
    asset_type: str

    source_address: str | None = None
    destination_address: str | None = None

    protocol: str | None = None

    command: str | None = None

    register_address: int | None = None

    previous_value: Any | None = None
    value: Any | None = None

    unit: str | None = None

    process_id: str | None = None

    severity: Severity = Severity.INFO

    metadata: dict[str, Any] = Field(default_factory=dict)
