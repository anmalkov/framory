from __future__ import annotations

import hashlib
import logging
import os
import random
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

from app.config import config
from app.models.photo import Photo

logger = logging.getLogger(__name__)

_JPEG_EXTENSIONS = {".jpg", ".jpeg"}


def scan_folder(folder: str) -> list[str]:
    """Scan a folder under photo_root for JPEG files. Returns relative paths."""
    base = Path(config.photo_root) / folder
    if not base.is_dir():
        return []
    results: list[str] = []
    try:
        with os.scandir(base) as entries:
            for entry in entries:
                if entry.is_file() and Path(entry.name).suffix.lower() in _JPEG_EXTENSIONS:
                    results.append(entry.name)
    except OSError:
        logger.warning("Failed to scan folder: %s", base)
        return []
    results.sort()
    return results


def generate_sequence(photos: list[str]) -> list[str]:
    """Fisher-Yates shuffle of photo list."""
    shuffled = list(photos)
    random.shuffle(shuffled)
    return shuffled


def get_photo_metadata(folder: str, relative_path: str) -> Photo:
    """Extract metadata from a photo file."""
    full_path = Path(config.photo_root) / folder / relative_path
    stat = full_path.stat()
    date_taken = _extract_exif_date(full_path)
    return Photo(
        path=relative_path,
        filename=Path(relative_path).name,
        date_taken=date_taken,
        date_modified=datetime.fromtimestamp(stat.st_mtime),
        file_size=stat.st_size,
    )


def resize_and_cache(folder: str, relative_path: str) -> Path:
    """Resize photo and cache to disk. Returns path to cached file."""
    _validate_path(folder, relative_path)

    source = Path(config.photo_root) / folder / relative_path
    cache_key = hashlib.sha256(f"{folder}/{relative_path}".encode()).hexdigest()
    cached = Path(config.cache_path) / f"{cache_key}.jpg"

    if cached.exists() and cached.stat().st_mtime >= source.stat().st_mtime:
        return cached

    img = Image.open(source)
    img = ImageOps.exif_transpose(img)
    max_size = config.photo_max_size
    img.thumbnail((max_size, max_size), Image.LANCZOS)

    cached.parent.mkdir(parents=True, exist_ok=True)
    img.save(cached, "JPEG", quality=85)
    return cached


def _extract_exif_date(path: Path) -> datetime | None:
    """Extract date taken from EXIF. Fallback chain: tag 36867 → 306 → None."""
    try:
        img = Image.open(path)
        exif = img._getexif()  # type: ignore[attr-defined]
        if exif is None:
            return None
        for tag in (36867, 306):
            raw = exif.get(tag)
            if raw:
                try:
                    return datetime.strptime(str(raw), "%Y:%m:%d %H:%M:%S")
                except ValueError:
                    continue
    except Exception:
        logger.debug("EXIF extraction failed for %s", path)
    return None


def _validate_path(folder: str, relative_path: str) -> None:
    """Prevent path traversal attacks."""
    base = Path(config.photo_root).resolve()
    full = (base / folder / relative_path).resolve()
    if not str(full).startswith(str(base)):
        msg = "Path traversal detected"
        raise ValueError(msg)
