# Data Model: Photo Transition Progress Bar

**Feature**: 003-photo-progress-bar  
**Date**: 2026-03-03

## Entity Changes

### Channel (modified)

The existing `Channel` entity gains one new field. No new entities are introduced.

#### New Field

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `show_progress_bar` | boolean | `true` | Controls visibility of the photo transition progress line for this channel |

#### Validation Rules

- Must be a boolean value (true/false)
- Default: `true` (progress bar visible)
- No cross-field validation needed

#### State Transitions

No new state transitions. The `show_progress_bar` field is a static configuration value — it does not participate in the playback state machine.

### Database Schema Change

**Table**: `channels`

**New column**:
```sql
show_progress_bar INTEGER NOT NULL DEFAULT 1
```

SQLite uses `1` for true, `0` for false. Default `1` ensures existing channels show the progress bar after migration.

**Migration**: `ALTER TABLE channels ADD COLUMN show_progress_bar INTEGER NOT NULL DEFAULT 1`

The `CREATE TABLE` in `schema.sql` is also updated for fresh installs.

## Backend Model (Pydantic)

### Channel model (`app/models/channel.py`)

Add field:
```
show_progress_bar: bool = True
```

### Message models (`app/models/messages.py`)

**ChannelConfig** (server → client in StateMessage):
```
show_progress_bar: bool
```

**ConfigureSettings** (client → server in ConfigureMessage):
```
show_progress_bar: bool | None = None
```

## Frontend Model (TypeScript)

### ChannelConfig interface (`channelReducer.ts`)

Add field:
```
show_progress_bar: boolean
```

### Initial state

```
config: { folder: "", delay_seconds: 60, stop_time: "00:00", show_progress_bar: true }
```

### ConfigureSettings in useWebSocket

Add optional field:
```
show_progress_bar?: boolean
```

## Data Flow

```
Settings Toggle → sendConfigure({ show_progress_bar: true/false })
                → WebSocket → channel_manager.handle_configure()
                → save_channel() → SQLite
                → broadcast_state() → WebSocket → all clients
                → channelReducer SET_STATE → ProgressBar visibility
```

The setting flows through the existing configure/broadcast pipeline — no new data paths required.
