# Data Model: Add Channel UI

**Feature Branch**: `005-add-channel-ui`
**Date**: 2026-03-04

## Entity Changes

This feature does not introduce new entities. It modifies the **channel creation flow** to accept an optional folder at creation time.

### Channel (existing — no schema changes)

The `Channel` entity already has all required fields. No database migration needed.

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `id` | `str` | Unchanged | Validated: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`, 2–50 chars |
| `folder` | `str` | **Set at creation** (was always set post-creation via WebSocket) | Path relative to photo_root. Empty string = unconfigured. |
| `sequence` | `list[str]` | **Populated at creation** when folder is provided | Shuffled list of photo paths. Previously only populated on first `play` or `configure`. |

All other Channel fields remain unchanged.

### CreateChannelRequest (API model — modified)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | `str` | Yes | 2–50 chars, `^[a-z0-9][a-z0-9-]*[a-z0-9]$` | Unchanged |
| `folder` | `str \| None` | No | No `..`, must resolve under photo_root, must be an existing directory | **NEW** — optional folder path relative to photo_root |

### Validation Rules (folder at creation)

When `folder` is provided in the creation request:
1. Must not contain `..` (path traversal prevention)
2. Must resolve to a directory under `config.photo_root`
3. The resolved path must exist and be a directory
4. If valid, the channel is created with this folder AND the photo sequence is generated immediately
5. If invalid, return 400 with descriptive error message

When `folder` is omitted or `null`:
- Channel is created with `folder = config.default_folder` (current behavior, backward compatible)

## State Transitions

No changes to the state machine. A channel created with a folder still starts in `stopped_manual` state — the user navigates to the slideshow and playback begins via WebSocket `play` command as before.

## Frontend State

### CreateChannelForm (local component state)

| State | Type | Description |
|-------|------|-------------|
| `name` | `string` | Channel name input (auto-lowercased) |
| `nameError` | `string \| null` | Validation error message for name field |
| `selectedFolder` | `string \| null` | Selected folder path (null = not yet selected) |
| `photoCount` | `number` | Photo count in selected folder |
| `submitting` | `boolean` | Whether creation request is in flight |
| `submitError` | `string \| null` | Server error from creation attempt |
| `showFolderBrowser` | `boolean` | Whether folder browser is open |

### FolderBrowser (local component state)

| State | Type | Description |
|-------|------|-------------|
| `currentPath` | `string` | Currently browsed folder path (empty = root) |
| `folders` | `FolderEntry[]` | Child folders of current path |
| `photoCount` | `number` | JPEG count in current folder |
| `parentPath` | `string \| null` | Parent folder path (null if at root) |
| `loading` | `boolean` | Whether folder list is being fetched |
| `error` | `string \| null` | Fetch error message |
