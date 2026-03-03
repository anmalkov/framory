# Quickstart: Channel-Based Digital Photo Frame

**Feature Branch**: `001-channel-photo-frame`
**Date**: 2026-03-02

## Prerequisites

- Python 3.14+
- Node.js 20+ (for frontend build)
- A directory with JPEG photos (simulates NAS mount)

## Local Development Setup

### 1. Clone and prepare

```bash
git checkout 001-channel-photo-frame
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -e ".[dev]"

# Configure environment
cp .env.example .env
# Edit .env:
#   FRAMORY_PHOTO_ROOT=/path/to/your/photos
#   FRAMORY_DB_PATH=./data/framory.db
#   FRAMORY_TIMEZONE=Europe/Brussels
#   FRAMORY_PHOTO_MAX_SIZE=1920

# Initialize database directory
mkdir -p data

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend (separate terminal)

```bash
cd frontend

# Install dependencies
npm install

# Configure dev proxy to backend
# vite.config.ts already proxies /api and /ws to localhost:8000

# Run frontend dev server
npm run dev
```

### 4. Open in browser

- Landing page: `http://localhost:5173/`
- Create a channel by navigating to: `http://localhost:5173/?channel=test`
- Confirm channel creation, configure a photo folder, press Play

## Docker Build

```bash
# Build single image
docker build -t framory:latest .

# Run with local photo directory
docker run -p 8000:8000 \
  -v /path/to/photos:/photos:ro \
  -v framory-data:/data \
  -e FRAMORY_TIMEZONE=Europe/Brussels \
  -e FRAMORY_PHOTO_MAX_SIZE=1920 \
  framory:latest
```

Open `http://localhost:8000/` in a browser.

## k3s Deployment

```bash
# Apply Kustomize manifests
kubectl apply -k k8s/

# Verify pod is running
kubectl get pods -l app=framory

# Access via service
# Default: http://framory.local (requires DNS or /etc/hosts entry)
```

## Testing

### Backend tests

```bash
cd backend
pytest --cov=app tests/
```

### Frontend tests

```bash
cd frontend
npm test
```

## Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FRAMORY_PHOTO_ROOT` | `/photos` | Root path for photo library |
| `FRAMORY_DB_PATH` | `/data/framory.db` | SQLite database file |
| `FRAMORY_CACHE_PATH` | `/data/cache` | Resized photo cache directory |
| `FRAMORY_TIMEZONE` | `Europe/Brussels` | Global timezone for daily stop |
| `FRAMORY_PHOTO_MAX_SIZE` | `1920` | Max pixels on longest edge |
| `FRAMORY_DEFAULT_FOLDER` | `""` | Default photo folder for new channels |
| `FRAMORY_DEFAULT_DELAY_SECONDS` | `60` | Default slideshow delay (seconds) |
| `FRAMORY_DEFAULT_STOP_TIME` | `00:00` | Default daily stop time |
