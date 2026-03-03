# WebSocket Contract Changes: Photo Transition Progress Bar

**Feature**: 003-photo-progress-bar  
**Date**: 2026-03-03  
**Extends**: [001 WebSocket contract](../../001-channel-photo-frame/contracts/websocket.md)

## Changes Summary

Only existing message types are modified — no new message types introduced.

---

## Server → Client: `state` Message

### Changed: `config` Object

The `config` object inside the `state` message gains one new field.

**Before**:
```json
{
  "type": "state",
  "config": {
    "folder": "family",
    "delay_seconds": 60,
    "stop_time": "00:00"
  }
}
```

**After**:
```json
{
  "type": "state",
  "config": {
    "folder": "family",
    "delay_seconds": 60,
    "stop_time": "00:00",
    "show_progress_bar": true
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `show_progress_bar` | boolean | `true` | Whether the progress line should be rendered on this channel |

**Backward compatibility**: New field with default value. Older clients that don't recognize it will ignore it.

---

## Client → Server: `configure` Message

### Changed: `settings` Object

The `settings` object inside the `configure` message accepts a new optional field.

**Example**:
```json
{
  "type": "configure",
  "settings": {
    "show_progress_bar": false
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `show_progress_bar` | boolean | No | Set progress bar visibility for this channel |

**Validation**: Must be a boolean if provided. Non-boolean values are rejected as invalid config.

**Backward compatibility**: Optional field. Older clients that don't send it have no effect — server retains current value.

---

## No Changes

The following message types are **unchanged**:
- `command` (client → server)
- `ping` / `pong`
- `error` (server → client)
