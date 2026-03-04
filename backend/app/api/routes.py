from __future__ import annotations

import os
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, field_validator

from app.config import config
from app.services import photo_service
from app.services.channel_manager import channel_manager

router = APIRouter(prefix="/api")

_CHANNEL_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]*[a-z0-9]$")


class CreateChannelRequest(BaseModel):
    id: str
    folder: str | None = None

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        if len(v) < 2 or len(v) > 50:
            msg = "Channel ID must be 2-50 characters"
            raise ValueError(msg)
        if not _CHANNEL_ID_RE.match(v):
            msg = "Invalid channel ID format"
            raise ValueError(msg)
        return v


@router.get("/health")
async def health() -> dict[str, str]:
    db_ok = "ok"
    photos_ok = "ok"

    if not Path(config.photo_root).is_dir():
        photos_ok = "unavailable"

    status = "healthy" if db_ok == "ok" and photos_ok == "ok" else "degraded"
    resp = {"status": status, "db": db_ok, "photos": photos_ok}
    if status == "degraded":
        raise HTTPException(status_code=503, detail=resp)
    return resp


@router.get("/channels")
async def list_channels() -> dict[str, list[dict[str, object]]]:
    channels = channel_manager.get_all_channels()
    result = []
    for ch in channels:
        result.append(
            {
                "id": ch.id,
                "folder": ch.folder,
                "delay_seconds": ch.delay_seconds,
                "stop_time": ch.stop_time,
                "playback_state": ch.state.value,
                "current_index": ch.current_index,
                "sequence_length": ch.sequence_length,
                "show_progress_bar": ch.show_progress_bar,
                "client_count": channel_manager.client_count(ch.id),
                "created_at": ch.created_at.isoformat() if ch.created_at else "",
                "updated_at": ch.updated_at.isoformat() if ch.updated_at else "",
            }
        )
    return {"channels": result}


@router.get("/channels/{channel_id}")
async def get_channel(channel_id: str) -> dict[str, object]:
    ch = channel_manager.get_channel(channel_id)
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")

    photo_data = None
    photo_path = ch.current_photo_path
    if photo_path and ch.folder:
        try:
            meta = photo_service.get_photo_metadata(ch.folder, photo_path)
            photo_data = {
                "filename": meta.filename,
                "date_taken": meta.date_taken.isoformat() if meta.date_taken else None,
                "date_modified": meta.date_modified.isoformat()
                if meta.date_modified
                else None,
            }
        except Exception:
            pass

    return {
        "id": ch.id,
        "folder": ch.folder,
        "delay_seconds": ch.delay_seconds,
        "stop_time": ch.stop_time,
        "playback_state": ch.state.value,
        "current_index": ch.current_index,
        "sequence_length": ch.sequence_length,
        "has_previous": ch.has_previous,
        "show_progress_bar": ch.show_progress_bar,
        "client_count": channel_manager.client_count(ch.id),
        "photo": photo_data,
        "created_at": ch.created_at.isoformat() if ch.created_at else "",
        "updated_at": ch.updated_at.isoformat() if ch.updated_at else "",
    }


@router.post("/channels", status_code=201)
async def create_channel(req: CreateChannelRequest) -> dict[str, object]:
    existing = channel_manager.get_channel(req.id)
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Channel '{req.id}' already exists"
        )

    if req.folder is not None:
        if ".." in req.folder:
            raise HTTPException(status_code=400, detail="Invalid folder path")
        base = Path(config.photo_root).resolve()
        target = (base / req.folder).resolve()
        if not str(target).startswith(str(base)):
            raise HTTPException(status_code=400, detail="Invalid folder path")
        if not target.is_dir():
            raise HTTPException(status_code=400, detail="Folder not found")

    ch = await channel_manager.create_channel(req.id, folder=req.folder)
    return {
        "id": ch.id,
        "folder": ch.folder,
        "delay_seconds": ch.delay_seconds,
        "stop_time": ch.stop_time,
        "playback_state": ch.state.value,
        "current_index": ch.current_index,
        "sequence_length": ch.sequence_length,
        "has_previous": ch.has_previous,
        "show_progress_bar": ch.show_progress_bar,
        "client_count": 0,
        "photo": None,
        "created_at": ch.created_at.isoformat() if ch.created_at else "",
        "updated_at": ch.updated_at.isoformat() if ch.updated_at else "",
    }


@router.get("/channels/{channel_id}/photo")
async def get_channel_photo(channel_id: str) -> Response:
    ch = channel_manager.get_channel(channel_id)
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")

    photo_path = ch.current_photo_path
    if not photo_path or not ch.folder:
        raise HTTPException(status_code=404, detail="No photo available")

    try:
        cached = photo_service.resize_and_cache(ch.folder, photo_path)
        data = cached.read_bytes()
        return Response(
            content=data,
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=31536000, immutable"},
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No photo available") from None
    except OSError:
        raise HTTPException(status_code=503, detail="Photo source unavailable") from None


@router.get("/folders")
async def browse_folders(path: str = "") -> dict[str, object]:
    # Path traversal prevention
    if ".." in path:
        raise HTTPException(status_code=400, detail="Invalid path")

    base = Path(config.photo_root).resolve()
    target = (base / path).resolve()

    if not str(target).startswith(str(base)):
        raise HTTPException(status_code=400, detail="Invalid path")

    if not target.is_dir():
        raise HTTPException(status_code=404, detail="Folder not found")

    folders = []
    photo_count = 0

    try:
        with os.scandir(target) as entries:
            for entry in entries:
                if entry.is_dir():
                    rel = str(Path(entry.path).relative_to(base)).replace("\\", "/")
                    folders.append({"name": entry.name, "path": rel})
                elif entry.is_file():
                    if Path(entry.name).suffix.lower() in {".jpg", ".jpeg"}:
                        photo_count += 1
    except OSError:
        raise HTTPException(status_code=503, detail="Folder not accessible") from None

    folders.sort(key=lambda f: f["name"])

    parent = None
    if path:
        parent_path = str(Path(path).parent).replace("\\", "/")
        parent = "" if parent_path == "." else parent_path

    current = Path(path).name if path else ""

    return {
        "current": current,
        "parent": parent,
        "folders": folders,
        "photo_count": photo_count,
    }
