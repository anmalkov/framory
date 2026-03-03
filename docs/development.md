# Development Guide

Everything you need to set up, run, test, debug, and build Framory locally.

## Prerequisites

| Tool | Minimum Version | Check Command |
| ---- | --------------- | ------------- |
| Python | 3.12+ | `python --version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Docker | 24+ | `docker --version` |

## Backend Setup

Create and activate a virtual environment, then install dependencies:

```bash
cd backend
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -e ".[dev]"
```

### Configuration

The backend is configured via environment variables with the `FRAMORY_` prefix.
Defaults are defined in `backend/app/config.py`:

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `FRAMORY_PHOTO_ROOT` | `/photos` | Root directory for photo folders |
| `FRAMORY_DB_PATH` | `/data/framory.db` | SQLite database file path |
| `FRAMORY_CACHE_PATH` | `/data/cache` | Resized photo cache directory |
| `FRAMORY_TIMEZONE` | `Europe/Brussels` | Timezone for scheduled stop times |
| `FRAMORY_PHOTO_MAX_SIZE` | `1920` | Maximum photo dimension (pixels) |
| `FRAMORY_DEFAULT_FOLDER` | *(empty)* | Default photo folder for new channels |
| `FRAMORY_DEFAULT_DELAY_SECONDS` | `60` | Default slideshow delay (seconds) |
| `FRAMORY_DEFAULT_STOP_TIME` | `00:00` | Default daily stop time (HH:MM) |

For local development, override these by setting environment variables or using
a `.env` file (it is git-ignored).

## Frontend Setup

```bash
cd frontend
npm install
```

No additional environment variables are needed for local development — the Vite
dev server proxies API and WebSocket requests to the backend automatically (see
[Running Locally](#running-locally)).

## Running Locally

Start the backend and frontend in separate terminals:

**Backend:**

```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

The API server starts at `http://localhost:8000`.

**Frontend:**

```bash
cd frontend
npm run dev
```

The Vite dev server starts at `http://localhost:5173` and proxies requests:

- `/api/*` → `http://localhost:8000` (REST API)
- `/ws/*` → `ws://localhost:8000` (WebSocket)

This proxy is configured in `frontend/vite.config.ts` so that the frontend
can reach the backend without CORS issues during development.

Open `http://localhost:5173` in your browser to use the app.

## Testing

### Backend

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run only unit tests
pytest tests/unit/

# Run only integration tests
pytest tests/integration/
```

Tests use `pytest-asyncio` with `asyncio_mode = auto` — async test functions are
detected automatically.

### Frontend

```bash
cd frontend

# Run all tests
npm run test

# Run in watch mode
npm run test:watch
```

### Linting & Type Checking

**Backend:**

```bash
cd backend

# Lint with ruff
ruff check .

# Auto-fix lint issues
ruff check . --fix

# Type check with mypy (strict mode)
mypy .
```

**Frontend:**

```bash
cd frontend

# Lint with eslint
npm run lint
```

## Debugging

### Backend

- **Auto-reload**: `uvicorn app.main:app --reload` restarts the server on file
  changes
- **Logging**: The backend uses Python's `logging` module at INFO level by
  default. Key events (channel creation, client connect/disconnect, scheduled
  stops) are logged to stdout
- **Interactive debugging**: Set breakpoints in your IDE; uvicorn runs in the
  same process

### Frontend

- **Hot Module Replacement**: Vite HMR updates components in the browser
  instantly when you save a file — no manual refresh needed
- **Browser DevTools**: Use the Network tab to inspect WebSocket frames and API
  calls; use the Console for React errors and log output
- **React DevTools**: Install the React DevTools browser extension for component
  tree inspection and state debugging

## Docker Build

Build the production image from the repository root:

```bash
docker build -t framory:latest .
```

The Dockerfile uses a multi-stage build:

1. **frontend-build** (node:20-slim) — installs npm dependencies and runs
   `npm run build`
2. **backend-deps** (python:3.14-slim) — installs Python dependencies
3. **runtime** (python:3.14-slim) — copies the built frontend, backend, and
   dependencies into a minimal image

Run the image:

```bash
docker run -d \
  -p 8000:8000 \
  -v /path/to/your/photos:/photos:ro \
  -v framory-data:/data \
  framory:latest
```

Environment variables can be passed with `-e`:

```bash
docker run -d \
  -p 8000:8000 \
  -e FRAMORY_TIMEZONE=America/New_York \
  -e FRAMORY_DEFAULT_DELAY_SECONDS=30 \
  -v /path/to/photos:/photos:ro \
  -v framory-data:/data \
  framory:latest
```

## Project Structure

```text
framory/
├── backend/
│   ├── pyproject.toml          # Python project config, dependencies, tool settings
│   ├── app/
│   │   ├── main.py             # FastAPI app, lifespan events, route mounting
│   │   ├── config.py           # GlobalConfig with FRAMORY_ env vars
│   │   ├── api/
│   │   │   ├── routes.py       # REST API endpoints (/api/health, /api/channels)
│   │   │   └── websocket.py    # WebSocket handler (/ws/{channel_id})
│   │   ├── models/
│   │   │   ├── channel.py      # Channel model with playback states
│   │   │   ├── messages.py     # WebSocket message schemas (Pydantic)
│   │   │   └── photo.py        # Photo metadata model
│   │   ├── services/
│   │   │   ├── channel_manager.py  # In-memory channel state, client registry, commands
│   │   │   ├── photo_service.py    # Folder scanning, EXIF extraction, resize & cache
│   │   │   ├── scheduler.py        # Periodic stop-time checker
│   │   │   └── db.py               # SQLite persistence (aiosqlite)
│   │   └── db/
│   │       └── schema.sql      # Database schema (channels table + trigger)
│   └── tests/
│       ├── unit/
│       └── integration/
├── frontend/
│   ├── package.json            # Node.js dependencies and scripts
│   ├── vite.config.ts          # Vite dev server, proxy, build config
│   ├── tailwind.config.ts      # Tailwind CSS with Framory design tokens
│   ├── tsconfig.json           # TypeScript configuration
│   ├── src/
│   │   ├── App.tsx             # Router — landing page vs. channel page
│   │   ├── main.tsx            # React entry point
│   │   ├── components/         # UI components (PhotoViewer, PlaybackControls, etc.)
│   │   ├── context/            # Channel state management (React Context + reducer)
│   │   ├── hooks/              # useWebSocket, useFullscreen
│   │   ├── pages/              # LandingPage, ChannelPage
│   │   ├── services/           # API client (fetch wrappers)
│   │   └── styles/             # CSS design tokens
│   └── tests/
│       ├── unit/
│       └── integration/
├── k8s/                        # Kubernetes manifests (Deployment, Service, ConfigMap, PV/PVC)
├── specs/                      # Feature specifications (speckit workflow)
├── Dockerfile                  # Multi-stage production build
├── LICENSE                     # MIT License
└── README.md                   # Project overview (you are here)
```

## Code Style & Conventions

### Backend (Python)

- **Linter**: [ruff](https://docs.astral.sh/ruff/) — target Python 3.12, line
  length 100
- **Rules**: E (pycodestyle errors), F (pyflakes), I (isort), N (pep8-naming),
  W (pycodestyle warnings), UP (pyupgrade), B (flake8-bugbear),
  SIM (flake8-simplify), TCH (flake8-type-checking)
- **Type checking**: [mypy](https://mypy-lang.org/) in strict mode
- **Testing**: [pytest](https://docs.pytest.org/) with pytest-asyncio
  (auto mode)
- **Naming**: snake_case for functions/variables, PascalCase for classes, ALL_CAPS for constants

### Frontend (TypeScript)

- **Linter**: [eslint](https://eslint.org/) with TypeScript support
- **Framework**: React 19 with functional components and hooks
- **Styling**: Tailwind CSS 3.4 with custom design tokens defined in
  `frontend/src/styles/tokens.css`
- **Testing**: [Vitest](https://vitest.dev/) 3 with @testing-library/react
- **Naming**: camelCase for functions/variables, PascalCase for components and
  types
