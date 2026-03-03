# Data Model: Channel-Based Digital Photo Frame

**Feature Branch**: `001-channel-photo-frame`
**Date**: 2026-03-02

## Entities

### GlobalConfig

System-wide configuration. Loaded at startup from environment variables via Pydantic Settings.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `timezone` | `str` (IANA tz) | `"Europe/Brussels"` | Applied to all channel stop times (FR-G01) |
| `photo_max_size` | `int` (pixels) | `1920` | Longest-edge max for resized photos (FR-G02) |
| `photo_root` | `str` (path) | `"/photos"` | NFS mount point of NAS photo library |
| `db_path` | `str` (path) | `"/data/framory.db"` | SQLite database file path |
| `default_folder` | `str` | `""` | Default photo folder relative to photo_root (FR-024) |
| `default_delay_seconds` | `int` | `60` | Default slideshow delay in seconds (FR-022) |
| `default_stop_time` | `str` (HH:MM) | `"00:00"` | Default daily stop time (FR-023) |
| `cache_path` | `str` (path) | `"/data/cache"` | Directory for resized photo cache files |

**Validation rules**:
- `timezone` must be a valid IANA timezone identifier (validated via `zoneinfo.ZoneInfo`)
- `photo_max_size` must be between 480 and 3840
- `default_delay_seconds` must be >= 5

---

### Channel

An independent synchronized photo display group.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `str` | PK, slug-format (`[a-z0-9-]+`) | URL-safe channel identifier |
| `folder` | `str` | Path relative to photo_root (empty = unconfigured) | Photo source folder |
| `delay_seconds` | `int` | >= 5 | Auto-advance interval |
| `stop_time` | `str` (HH:MM) | 00:00–23:59 | Daily auto-stop in global timezone |
| `state` | `PlaybackState` | Enum | Current playback state |
| `current_index` | `int` | >= 0 | Position in photo sequence |
| `history` | `list[int]` | JSON serialized | Stack of previously visited sequence indices |
| `sequence` | `list[str]` | JSON serialized | Shuffled list of photo relative paths |
| `created_at` | `datetime` | Auto | Channel creation timestamp (UTC) |
| `updated_at` | `datetime` | Auto | Last state change timestamp (UTC) |

**Validation rules**:
- `id` must match `^[a-z0-9][a-z0-9-]*[a-z0-9]$` (min 2 chars, no leading/trailing hyphens)
- `folder` must be a valid non-empty directory under `photo_root` when validated (at play-time and configure-time, not at creation). Empty string is the initial "unconfigured" value.
- `delay_seconds` minimum 5 seconds to prevent thrashing
- `stop_time` must match `^([01]\d|2[0-3]):[0-5]\d$`
- `current_index` must be < len(sequence); clamped on sequence regeneration

**State transitions**:

```
              ┌─────────────┐
    create →  │   stopped   │ ◄── stop (manual)
              │  (manual)   │
              └──────┬──────┘
                     │ play
                     ▼
              ┌─────────────┐   all clients     ┌──────────────┐
              │   playing    │ ──disconnect────► │    stopped    │
              │              │                   │ (no clients)  │
              └──┬───────┬──┘                   └──────────────┘
                 │       │
                 │       │ daily stop time reached
                 │       ▼
                 │     ┌─────────────┐
                 │     │   stopped    │
                 │     │ (scheduled)  │
                 │     └─────────────┘
                 │
                 │ stop (manual)
                 ▼
              ┌─────────────┐
              │   stopped    │
              │  (manual)    │
              └─────────────┘

All stopped states → playing via "play" command.
"reset" can occur in any state → regenerates sequence, clears history, stays in current state.
"configure" (folder change) → regenerates sequence, clears history, resets to index 0.
auto-advance loops within playing state (next / prev reset the timer).
```

---

### PlaybackState

Enum representing channel playback state.

| Value | Description |
|-------|-------------|
| `playing` | Auto-advance active, timers running |
| `stopped_manual` | Stopped by user command |
| `stopped_scheduled` | Stopped by daily auto-stop |
| `stopped_no_clients` | Stopped because all clients disconnected |

---

### Photo

Metadata for a single photo in a channel's folder. Not persisted — derived on demand.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `path` | `str` | File system | Relative path from channel folder |
| `filename` | `str` | Derived from path | Display name (FR-030a) |
| `date_taken` | `datetime \| None` | EXIF tag 36867 | Primary date source |
| `date_modified` | `datetime` | File stat | Fallback date (FR-030a) |
| `file_size` | `int` | File stat | Original file size in bytes |

**Derivation rules**:
- `date_taken`: Extract EXIF DateTimeOriginal (tag 36867). If absent, try EXIF DateTime (tag 306). If both absent, use `None` and UI falls back to `date_modified`.
- Only `*.jpg` and `*.jpeg` files included (case-insensitive). All other files ignored (FR-004).

---

### PhotoSequence (embedded in Channel)

The ordered list of photos for a channel, stored as a JSON array of relative paths.

**Generation rules**:
- Scan channel's `folder` under `photo_root` for JPEG files
- Filter: only `*.jpg` / `*.jpeg` (case-insensitive)
- Apply Fisher-Yates shuffle using Python's `random.shuffle`
- Store as JSON array in channel's `sequence` column
- Regenerated on: channel creation, folder change (FR-025), reset (FR-017)

---

### NavigationHistory (embedded in Channel)

A stack of previously visited sequence indices enabling the Previous control.

**Rules**:
- When advancing (next or auto-advance): push current index onto history, then move to next index
- When going previous (prev): pop from history, move to popped index
- When history is empty: Previous is unavailable (FR-016)
- Cleared on: reset (FR-018), folder change (FR-025)
- Serialized as JSON array of integers in the channel record

---

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS channels (
    id              TEXT PRIMARY KEY,
    folder          TEXT NOT NULL,
    delay_seconds   INTEGER NOT NULL DEFAULT 60,
    stop_time       TEXT NOT NULL DEFAULT '00:00',
    state           TEXT NOT NULL DEFAULT 'stopped_manual',
    current_index   INTEGER NOT NULL DEFAULT 0,
    history         TEXT NOT NULL DEFAULT '[]',    -- JSON array of ints
    sequence        TEXT NOT NULL DEFAULT '[]',    -- JSON array of strings
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS channels_updated_at
    AFTER UPDATE ON channels
    FOR EACH ROW
BEGIN
    UPDATE channels SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = OLD.id;
END;
```

---

## Relationship Diagram

```
GlobalConfig (singleton, env-based)
    │
    ├── timezone ──────────► applied to all Channel.stop_time evaluations
    ├── photo_max_size ────► applied to all photo resize operations
    └── photo_root ────────► base path for all Channel.folder resolution
          │
          ▼
Channel (1:many per system)
    │
    ├── folder ──────────► points to directory under photo_root
    ├── sequence ────────► ordered list of Photo.path values
    ├── current_index ───► pointer into sequence
    ├── history ─────────► stack of previous sequence indices
    └── [WebSocket clients] ── runtime only, not persisted
          │
          ▼
Photo (derived, not persisted)
    └── metadata extracted on-demand via Pillow EXIF
```
