from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING

import aiosqlite

if TYPE_CHECKING:
    from app.models.channel import Channel

_db: aiosqlite.Connection | None = None
_SCHEMA_PATH = Path(__file__).resolve().parent.parent / "db" / "schema.sql"


async def init_db(db_path: str) -> None:
    global _db  # noqa: PLW0603
    _db = await aiosqlite.connect(db_path)
    _db.row_factory = aiosqlite.Row
    await _db.execute("PRAGMA journal_mode=WAL")
    schema = _SCHEMA_PATH.read_text()
    await _db.executescript(schema)
    # Migration: add show_progress_bar column for existing databases
    try:
        await _db.execute(
            "ALTER TABLE channels ADD COLUMN show_progress_bar INTEGER NOT NULL DEFAULT 1"
        )
    except Exception:  # noqa: BLE001 – duplicate column is expected
        pass
    await _db.commit()


async def close_db() -> None:
    global _db  # noqa: PLW0603
    if _db:
        await _db.close()
        _db = None


def _get_db() -> aiosqlite.Connection:
    if _db is None:
        msg = "Database not initialized"
        raise RuntimeError(msg)
    return _db


async def list_channels() -> list[dict[str, object]]:
    db = _get_db()
    cursor = await db.execute("SELECT * FROM channels ORDER BY created_at")
    rows = await cursor.fetchall()
    return [_row_to_dict(row) for row in rows]


async def get_channel(channel_id: str) -> dict[str, object] | None:
    db = _get_db()
    cursor = await db.execute("SELECT * FROM channels WHERE id = ?", (channel_id,))
    row = await cursor.fetchone()
    return _row_to_dict(row) if row else None


async def save_channel(channel: Channel) -> None:
    db = _get_db()
    await db.execute(
        """INSERT INTO channels (id, folder, delay_seconds, stop_time, state,
           current_index, history, sequence, show_progress_bar)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             folder = excluded.folder,
             delay_seconds = excluded.delay_seconds,
             stop_time = excluded.stop_time,
             state = excluded.state,
             current_index = excluded.current_index,
             history = excluded.history,
             sequence = excluded.sequence,
             show_progress_bar = excluded.show_progress_bar""",
        (
            channel.id,
            channel.folder,
            channel.delay_seconds,
            channel.stop_time,
            channel.state.value,
            channel.current_index,
            json.dumps(channel.history),
            json.dumps(channel.sequence),
            int(channel.show_progress_bar),
        ),
    )
    await db.commit()


async def delete_channel(channel_id: str) -> bool:
    db = _get_db()
    cursor = await db.execute("DELETE FROM channels WHERE id = ?", (channel_id,))
    await db.commit()
    return cursor.rowcount > 0


def _row_to_dict(row: aiosqlite.Row) -> dict[str, object]:
    d = dict(row)
    d["history"] = json.loads(str(d["history"]))
    d["sequence"] = json.loads(str(d["sequence"]))
    return d
