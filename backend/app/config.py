from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import field_validator
from pydantic_settings import BaseSettings


class GlobalConfig(BaseSettings):
    model_config = {"env_prefix": "FRAMORY_", "env_file": ".env"}

    timezone: str = "Europe/Brussels"
    photo_max_size: int = 1920
    photo_root: str = "/photos"
    db_path: str = "/data/framory.db"
    default_folder: str = ""
    default_delay_seconds: int = 60
    default_stop_time: str = "00:00"
    cache_path: str = "/data/cache"

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        try:
            ZoneInfo(v)
        except Exception as exc:
            msg = f"Invalid IANA timezone: {v}"
            raise ValueError(msg) from exc
        return v

    @field_validator("photo_max_size")
    @classmethod
    def validate_photo_max_size(cls, v: int) -> int:
        if not 480 <= v <= 3840:
            msg = "photo_max_size must be between 480 and 3840"
            raise ValueError(msg)
        return v

    @field_validator("default_delay_seconds")
    @classmethod
    def validate_delay(cls, v: int) -> int:
        if v < 5:
            msg = "default_delay_seconds must be >= 5"
            raise ValueError(msg)
        return v

    @field_validator("default_stop_time")
    @classmethod
    def validate_stop_time(cls, v: str) -> str:
        import re

        if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", v):
            msg = f"Invalid stop_time format (expected HH:MM): {v}"
            raise ValueError(msg)
        return v

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)

    def ensure_directories(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        Path(self.cache_path).mkdir(parents=True, exist_ok=True)


config = GlobalConfig()
