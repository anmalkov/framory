from __future__ import annotations

import enum
import re
from datetime import datetime

from pydantic import BaseModel, field_validator


class PlaybackState(str, enum.Enum):
    playing = "playing"
    stopped_manual = "stopped_manual"
    stopped_scheduled = "stopped_scheduled"
    stopped_no_clients = "stopped_no_clients"


_CHANNEL_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]*[a-z0-9]$")
_STOP_TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class Channel(BaseModel):
    id: str
    folder: str = ""
    delay_seconds: int = 60
    stop_time: str = "00:00"
    state: PlaybackState = PlaybackState.stopped_manual
    current_index: int = 0
    history: list[int] = []
    sequence: list[str] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        if len(v) < 2 or len(v) > 50:
            msg = "Channel ID must be 2-50 characters"
            raise ValueError(msg)
        if not _CHANNEL_ID_RE.match(v):
            msg = "Channel ID must be lowercase alphanumeric with hyphens, no leading/trailing hyphens"
            raise ValueError(msg)
        return v

    @field_validator("delay_seconds")
    @classmethod
    def validate_delay(cls, v: int) -> int:
        if v < 5:
            msg = "delay_seconds must be >= 5"
            raise ValueError(msg)
        return v

    @field_validator("stop_time")
    @classmethod
    def validate_stop_time(cls, v: str) -> str:
        if not _STOP_TIME_RE.match(v):
            msg = f"Invalid stop_time format: {v}"
            raise ValueError(msg)
        return v

    @property
    def sequence_length(self) -> int:
        return len(self.sequence)

    @property
    def has_previous(self) -> bool:
        return len(self.history) > 0

    @property
    def current_photo_path(self) -> str | None:
        if not self.sequence or self.current_index >= len(self.sequence):
            return None
        return self.sequence[self.current_index]
