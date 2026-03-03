from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class Photo(BaseModel):
    path: str
    filename: str
    date_taken: datetime | None = None
    date_modified: datetime | None = None
    file_size: int = 0
