# Quickstart: Photo Transition Progress Bar

**Feature**: 003-photo-progress-bar  
**Date**: 2026-03-03

## What This Feature Does

Adds a thin progress line at the bottom of the photo viewer that visually shows how long until the next photo appears. The line grows from left to right over the configured delay period and resets when a new photo loads. Users can toggle it on/off per channel via the settings panel.

## How to Verify

### 1. Progress Bar Animation

1. Open a channel with photos (e.g., `http://localhost:5173/family`)
2. Start playback (tap screen → press Play)
3. Observe the bottom of the screen — a thin semi-transparent white line should grow from left to right
4. When the line reaches full width, the next photo loads and the line resets

### 2. Settings Toggle

1. Tap the screen to show controls
2. Open Settings (gear icon)
3. Find the "Show progress bar" toggle
4. Turn it off — the line disappears immediately
5. Turn it on — the line reappears
6. Refresh the page — the setting should persist

### 3. Playback States

- **Playing**: Line animates smoothly
- **Stopped/Paused**: Line is hidden
- **Manual next/prev** (swipe or button): Line resets to zero
- **No photos**: Line is not rendered

## Key Files

| File | Role |
|------|------|
| `frontend/src/components/ProgressBar.tsx` | New — renders the animated progress line |
| `frontend/src/pages/ChannelPage.tsx` | Modified — includes ProgressBar component |
| `frontend/src/components/SettingsPanel.tsx` | Modified — adds toggle |
| `frontend/src/context/channelReducer.ts` | Modified — adds show_progress_bar to config |
| `frontend/src/hooks/useWebSocket.ts` | Modified — adds show_progress_bar to configure settings type |
| `backend/app/models/channel.py` | Modified — adds show_progress_bar field |
| `backend/app/models/messages.py` | Modified — adds to config/settings messages |
| `backend/app/services/channel_manager.py` | Modified — handles configure for new field |
| `backend/app/services/db.py` | Modified — persists new column |
| `backend/app/db/schema.sql` | Modified — adds column definition |

## Running Tests

```bash
# Backend
cd backend && python -m pytest tests/ -v

# Frontend
cd frontend && npm test
```
