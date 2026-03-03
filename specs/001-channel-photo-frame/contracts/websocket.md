# WebSocket Contract: Channel Sync Protocol

**Feature Branch**: `001-channel-photo-frame`
**Date**: 2026-03-02

## Connection

**Endpoint**: `ws://{host}/ws/{channel_id}`

- Each WebSocket connection is scoped to exactly one channel.
- The `channel_id` is a path parameter (slug format: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`, min 2 chars, no leading/trailing hyphens).
- On connect, the server sends an immediate `state` message with the full channel state.
- If the channel does not exist, the server closes the connection with code `4004` and reason `"Channel not found"`.

---

## Message Format

All messages are JSON objects with a required `type` discriminator field.

### Client → Server Messages

#### `command`

Triggers a playback control action on the channel.

```json
{
  "type": "command",
  "action": "play" | "stop" | "next" | "prev" | "reset"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `string` | Yes | Always `"command"` |
| `action` | `string` | Yes | One of: `play`, `stop`, `next`, `prev`, `reset` |

**Server behavior per action**:
- `play`: Validate folder is non-empty and points to a valid directory with JPEG files. If folder is empty, respond with `error` (code `INVALID_FOLDER`, message "No folder configured"). If valid, transition to `playing` state, start auto-advance timer.
- `stop`: Transition to `stopped_manual`, cancel auto-advance timer.
- `next`: Push current index to history, advance to next in sequence, reset auto-advance timer. If at end of sequence, wrap to index 0.
- `prev`: Pop from history, move to popped index, reset auto-advance timer. If history empty, respond with `error`.
- `reset`: Regenerate sequence (reshuffle), clear history, set index to 0, broadcast new state. Playback state is preserved (if playing, remains playing).

#### `configure`

Updates channel configuration.

```json
{
  "type": "configure",
  "settings": {
    "folder": "Vacations/2025",
    "delay_seconds": 30,
    "stop_time": "23:00"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `string` | Yes | Always `"configure"` |
| `settings` | `object` | Yes | Partial update — only include fields to change |
| `settings.folder` | `string` | No | Photo folder path relative to photo root |
| `settings.delay_seconds` | `integer` | No | Auto-advance interval in seconds (min: 5) |
| `settings.stop_time` | `string` | No | Daily stop time as `"HH:MM"` |

**Server behavior**:
- Validate all provided fields. On validation error, respond with `error` message.
- If `folder` changes: regenerate sequence for new folder, clear history, reset to index 0.
- If `delay_seconds` changes: restart auto-advance timer with new delay (if playing).
- If `stop_time` changes: if new time is already past for today and channel is playing, stop immediately.
- Broadcast updated state to all clients.

#### `ping`

Client keepalive.

```json
{
  "type": "ping"
}
```

Server responds with `pong`.

---

### Server → Client Messages

#### `state`

Full channel state synchronization. Sent on: connect, after every state change, on reconnect.

```json
{
  "type": "state",
  "channel_id": "living-room",
  "playback_state": "playing",
  "photo": {
    "url": "/api/channels/living-room/photo?v=142",
    "filename": "IMG_2025_0142.jpg",
    "date_taken": "2025-07-14T16:32:00",
    "date_modified": "2025-07-14T18:00:00"
  },
  "current_index": 47,
  "sequence_length": 8432,
  "has_previous": true,
  "config": {
    "folder": "Vacations/2025",
    "delay_seconds": 60,
    "stop_time": "00:00"
  },
  "seq": 142
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Always `"state"` |
| `channel_id` | `string` | Channel identifier |
| `playback_state` | `string` | One of: `playing`, `stopped_manual`, `stopped_scheduled`, `stopped_no_clients` |
| `photo` | `object \| null` | Current photo metadata, or `null` if no photos available |
| `photo.url` | `string` | URL to fetch the resized photo (includes `?v={seq}` for cache-busting) |
| `photo.filename` | `string` | Display filename |
| `photo.date_taken` | `string \| null` | ISO 8601 datetime from EXIF, or `null` |
| `photo.date_modified` | `string` | ISO 8601 datetime from file stat |
| `current_index` | `integer` | Zero-based position in sequence |
| `sequence_length` | `integer` | Total photos in sequence |
| `has_previous` | `boolean` | Whether Previous is available (history non-empty) |
| `config` | `object` | Current channel configuration |
| `seq` | `integer` | Monotonically increasing sequence number for ordering |

#### `error`

Validation or processing error.

```json
{
  "type": "error",
  "message": "No previous photo available",
  "code": "NO_HISTORY"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Always `"error"` |
| `message` | `string` | Human-readable error description |
| `code` | `string` | Machine-readable error code |

**Error codes**:
| Code | Meaning |
|------|---------|
| `NO_HISTORY` | Previous requested but history is empty |
| `INVALID_FOLDER` | Configured folder does not exist or is empty |
| `INVALID_CONFIG` | Configuration validation failed |
| `NO_PHOTOS` | Channel folder contains no JPEG files |

#### `pong`

Server keepalive response.

```json
{
  "type": "pong"
}
```

---

## Connection Lifecycle

```
Client                          Server
  │                               │
  │──── WS connect ──────────────►│  Validate channel_id exists
  │                               │  Register client in channel
  │◄──── state (full sync) ──────│  Send current state immediately
  │                               │
  │──── command (next) ──────────►│  Update state, persist
  │◄──── state (broadcast) ──────│  Broadcast to ALL clients in channel
  │                               │
  │──── configure ───────────────►│  Validate, update, persist
  │◄──── state (broadcast) ──────│  Broadcast to ALL clients
  │     or                        │
  │◄──── error ──────────────────│  If validation failed
  │                               │
  │──── ping ────────────────────►│
  │◄──── pong ───────────────────│
  │                               │
  │  (auto-advance timer fires)   │
  │◄──── state (broadcast) ──────│  Server-initiated advance
  │                               │
  │  (daily stop time reached)    │
  │◄──── state (broadcast) ──────│  playback_state → stopped_scheduled
  │                               │
  │──── disconnect ──────────────►│  Unregister client
  │                               │  If last client: stop channel
```

## Close Codes

| Code | Reason | Description |
|------|--------|-------------|
| `1000` | Normal closure | Client intentionally disconnected |
| `4004` | Channel not found | Channel ID does not exist |
| `4400` | Bad message | Unparseable JSON or unknown message type |
