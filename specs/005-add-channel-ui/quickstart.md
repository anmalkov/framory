# Quickstart: Add Channel UI

**Feature Branch**: `005-add-channel-ui`
**Date**: 2026-03-04

## Prerequisites

- Python 3.12+
- Node.js 20+
- A directory with JPEG photos (at least one subfolder with `.jpg`/`.jpeg` files)

## Local Development Setup

### 1. Switch to feature branch

```bash
git checkout 005-add-channel-ui
```

### 2. Backend

```bash
cd backend

# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Install dependencies (if not already)
pip install -e ".[dev]"

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend (separate terminal)

```bash
cd frontend

# Install dependencies (if not already)
npm install

# Run frontend dev server
npm run dev
```

### 4. Verify the feature

1. Open `http://localhost:5173/` in a browser
2. If no channels exist, the empty state should show an "Add Channel" button (not a URL hint)
3. Click "Add Channel"
4. Enter a channel name (e.g., `family-photos`) — should auto-lowercase and validate in real-time
5. Browse folders and select one with photos — photo count should display
6. Click "Create" — redirected to the new channel's slideshow view
7. Tap the screen to show playback controls — Home button should be visible
8. Click the Home button — redirected back to the channel list at `/`

### 5. Run tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## Testing Checklist

- [ ] Empty state shows "Add Channel" button
- [ ] "Add Channel" button visible when channels already exist
- [ ] Channel name validation rejects invalid input in real-time
- [ ] Folder browser shows folders and photo counts
- [ ] Folder browser supports navigating into subfolders and back
- [ ] Channel creation with folder succeeds and redirects
- [ ] Duplicate channel name shows error without losing form state
- [ ] Cancel returns to home screen
- [ ] Home button visible in slideshow playback controls
- [ ] Home button navigates to `/` (channel list)
