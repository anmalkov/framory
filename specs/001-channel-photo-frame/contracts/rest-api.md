# REST API Contract

**Feature Branch**: `001-channel-photo-frame`
**Date**: 2026-03-02
**Base URL**: `http://{host}/api`

---

## Endpoints

### GET /api/channels

List all existing channels.

**Response** `200 OK`:
```json
{
  "channels": [
    {
      "id": "living-room",
      "folder": "Vacations/2025",
      "delay_seconds": 60,
      "stop_time": "00:00",
      "playback_state": "playing",
      "current_index": 47,
      "sequence_length": 8432,
      "client_count": 3,
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-03-02T14:30:00Z"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `channels` | `array` | List of channel summaries |
| `channels[].id` | `string` | Channel identifier |
| `channels[].folder` | `string` | Configured photo folder |
| `channels[].delay_seconds` | `integer` | Auto-advance interval |
| `channels[].stop_time` | `string` | Daily stop time (HH:MM) |
| `channels[].playback_state` | `string` | Current state |
| `channels[].current_index` | `integer` | Current position in sequence |
| `channels[].sequence_length` | `integer` | Total photos in sequence |
| `channels[].client_count` | `integer` | Currently connected WebSocket clients |
| `channels[].created_at` | `string` | ISO 8601 UTC |
| `channels[].updated_at` | `string` | ISO 8601 UTC |

---

### GET /api/channels/{channel_id}

Get a single channel's details.

**Response** `200 OK`:
```json
{
  "id": "living-room",
  "folder": "Vacations/2025",
  "delay_seconds": 60,
  "stop_time": "00:00",
  "playback_state": "playing",
  "current_index": 47,
  "sequence_length": 8432,
  "has_previous": true,
  "client_count": 3,
  "photo": {
    "filename": "IMG_2025_0142.jpg",
    "date_taken": "2025-07-14T16:32:00",
    "date_modified": "2025-07-14T18:00:00"
  },
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-02T14:30:00Z"
}
```

**Response** `404 Not Found`:
```json
{
  "detail": "Channel not found"
}
```

---

### POST /api/channels

Create a new channel. Called by the frontend after user confirms creation.

**Request**:
```json
{
  "id": "living-room"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Channel ID (slug format: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`, 2–50 chars, no leading/trailing hyphens) |

**Response** `201 Created`:
```json
{
  "id": "living-room",
  "folder": "",
  "delay_seconds": 60,
  "stop_time": "00:00",
  "playback_state": "stopped_manual",
  "current_index": 0,
  "sequence_length": 0,
  "has_previous": false,
  "client_count": 0,
  "photo": null,
  "created_at": "2026-03-02T15:00:00Z",
  "updated_at": "2026-03-02T15:00:00Z"
}
```

**Response** `409 Conflict`:
```json
{
  "detail": "Channel 'living-room' already exists"
}
```

**Response** `422 Unprocessable Entity`:
```json
{
  "detail": "Invalid channel ID format"
}
```

---

### GET /api/channels/{channel_id}/photo

Serve the current resized photo for a channel as a JPEG image.

**Response** `200 OK`:
- **Content-Type**: `image/jpeg`
- **Cache-Control**: `public, max-age=31536000, immutable` (each `?v={seq}` URL is unique per photo; safe to cache indefinitely)
- **Body**: Resized JPEG binary

**Response** `404 Not Found`:
```json
{
  "detail": "No photo available"
}
```

**Response** `503 Service Unavailable`:
```json
{
  "detail": "Photo source unavailable"
}
```

**Notes**:
- Returns the photo at the channel's current sequence index, resized to the global `photo_max_size`.
- Resized photos are cached to disk; subsequent requests serve from cache.
- If the source file is unreadable/corrupt, returns 404 and the channel auto-advances.

---

### GET /api/folders

Browse available photo folders on the NAS.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `path` | `string` | `""` | Subdirectory to browse (relative to photo root) |

**Response** `200 OK`:
```json
{
  "current": "Vacations",
  "parent": "",
  "folders": [
    { "name": "2024", "path": "Vacations/2024" },
    { "name": "2025", "path": "Vacations/2025" }
  ],
  "photo_count": 0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `current` | `string` | Current folder name |
| `parent` | `string \| null` | Parent folder path, or `null` if at root |
| `folders` | `array` | Subdirectories |
| `photo_count` | `integer` | Count of JPEG files in current folder (not recursive) |

**Response** `404 Not Found`:
```json
{
  "detail": "Folder not found"
}
```

**Security**: Path traversal is prevented — the server validates that resolved paths remain under the photo root. Any path containing `..` or resolving outside the photo root returns `400 Bad Request`.

---

### GET /api/health

Health check endpoint for k3s liveness/readiness probes.

**Response** `200 OK`:
```json
{
  "status": "healthy",
  "db": "ok",
  "photos": "ok"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | `"healthy"` or `"degraded"` |
| `db` | `string` | `"ok"` if SQLite is accessible |
| `photos` | `string` | `"ok"` if photo root is mounted and accessible |

**Response** `503 Service Unavailable` (if DB or photos inaccessible):
```json
{
  "status": "degraded",
  "db": "ok",
  "photos": "unavailable"
}
```

---

## SPA Routing

All non-API, non-WebSocket requests serve the React SPA:

| Path Pattern | Served By |
|-------------|-----------|
| `/api/*` | REST API routes |
| `/ws/{channel_id}` | WebSocket handler |
| `/*` | `index.html` (SPA with client-side routing) |

**Frontend routes** (handled by React Router or equivalent):

| Route | Page | Description |
|-------|------|-------------|
| `/` | LandingPage | Channel list + create flow |
| `/?channel={id}` | ChannelPage | Fullscreen photo frame for channel |

---

## Error Response Format

All API errors follow a consistent format:

```json
{
  "detail": "Human-readable error message"
}
```

This matches FastAPI's default `HTTPException` response format.
