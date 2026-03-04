# REST API Contract: Add Channel UI

**Feature Branch**: `005-add-channel-ui`
**Date**: 2026-03-04
**Base URL**: `http://{host}/api`

This document describes only the **changed** endpoint. All other endpoints remain as defined in `specs/001-channel-photo-frame/contracts/rest-api.md`.

---

## Modified Endpoint

### POST /api/channels

Create a new channel, optionally with a pre-configured photo folder.

**Request**:
```json
{
  "id": "living-room",
  "folder": "family"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Channel ID (slug format: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`, 2–50 chars) |
| `folder` | `string \| null` | No | Photo folder path relative to photo_root. Omit or set `null` for default. |

**Backward compatibility**: Omitting `folder` produces identical behavior to the current implementation (folder set to `config.default_folder`).

**Response** `201 Created`:
```json
{
  "id": "living-room",
  "folder": "family",
  "delay_seconds": 60,
  "stop_time": "00:00",
  "playback_state": "stopped_manual",
  "current_index": 0,
  "sequence_length": 142,
  "has_previous": false,
  "show_progress_bar": false,
  "client_count": 0,
  "photo": null,
  "created_at": "2026-03-04T15:00:00Z",
  "updated_at": "2026-03-04T15:00:00Z"
}
```

Note: `sequence_length` will be > 0 when a valid folder with photos is provided.

**Response** `400 Bad Request` (invalid folder):
```json
{
  "detail": "Invalid folder path"
}
```

**Response** `400 Bad Request` (folder not found):
```json
{
  "detail": "Folder not found"
}
```

**Response** `409 Conflict` (unchanged):
```json
{
  "detail": "Channel 'living-room' already exists"
}
```

**Response** `422 Unprocessable Entity` (unchanged):
```json
{
  "detail": "Invalid channel ID format"
}
```

---

## Unchanged Endpoints

The following endpoints are NOT modified by this feature:

- `GET /api/channels` — unchanged
- `GET /api/channels/{channel_id}` — unchanged
- `GET /api/channels/{channel_id}/photo` — unchanged
- `GET /api/folders` — unchanged (reused by frontend folder browser)

## Frontend API Changes

### `createChannel(id: string, folder?: string): Promise<ChannelDetail>`

The existing `createChannel` function in `frontend/src/services/api.ts` gains an optional `folder` parameter:

```typescript
export async function createChannel(
  id: string,
  folder?: string,
): Promise<ChannelDetail> {
  return apiFetch<ChannelDetail>("/api/channels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...(folder != null && { folder }) }),
  });
}
```
