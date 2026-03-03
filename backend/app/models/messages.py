from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


# --- Client → Server ---


class CommandMessage(BaseModel):
    type: Literal["command"] = "command"
    action: Literal["play", "stop", "next", "prev", "reset"]


class ConfigureSettings(BaseModel):
    folder: str | None = None
    delay_seconds: int | None = None
    stop_time: str | None = None


class ConfigureMessage(BaseModel):
    type: Literal["configure"] = "configure"
    settings: ConfigureSettings


class PingMessage(BaseModel):
    type: Literal["ping"] = "ping"


# --- Server → Client ---


class PhotoInfo(BaseModel):
    url: str
    filename: str
    date_taken: str | None = None
    date_modified: str | None = None


class ChannelConfig(BaseModel):
    folder: str
    delay_seconds: int
    stop_time: str


class StateMessage(BaseModel):
    type: Literal["state"] = "state"
    channel_id: str
    playback_state: str
    photo: PhotoInfo | None = None
    current_index: int = 0
    sequence_length: int = 0
    has_previous: bool = False
    config: ChannelConfig
    seq: int = 0


class ErrorMessage(BaseModel):
    type: Literal["error"] = "error"
    message: str
    code: str


class PongMessage(BaseModel):
    type: Literal["pong"] = "pong"
