# Implementation Plan: Channel-Based Digital Photo Frame

**Branch**: `001-channel-photo-frame` | **Date**: 2026-03-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-channel-photo-frame/spec.md`

## Summary

Build a home digital photo frame system that turns any browser-equipped device into a synchronized photo display. A Python/FastAPI backend serves resized JPEG photos from a NAS-mounted library over WebSocket-synced channels, while a React/TypeScript SPA provides fullscreen kiosk-style playback with swipe gestures. Multiple independent channels support multi-room operation with per-channel configuration (photo folder, delay, daily stop time). Deployed as a single Docker image on k3s with NFS for photo access and PVC-backed SQLite for state persistence.

## Technical Context

**Language/Version**: Python 3.14+ (backend), TypeScript (frontend)
**Primary Dependencies (backend)**: FastAPI, Uvicorn, Pillow, aiosqlite, Pydantic Settings, asyncio
**Primary Dependencies (frontend)**: React 18+, Vite, Tailwind CSS, react-swipeable, React Context + useReducer
**Storage**: SQLite via aiosqlite (PVC-backed in k3s)
**Testing**: pytest + pytest-asyncio (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Docker on k3s (Linux); clients are Android tablets/phones via modern browser
**Project Type**: Web application (FastAPI backend serving React SPA + WebSocket real-time sync)
**Performance Goals**: <2s channel sync across tablets, <500ms API p95, <2.5s LCP, smooth slideshow on older tablets
**Constraints**: Limited tablet memory, local network only, read-only NAS access, 10,000+ JPEGs per folder, single-image Docker deployment
**Scale/Scope**: ~10 concurrent devices, 5+ simultaneous channels, 10,000+ photos per channel folder

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality** | ✅ PASS | TypeScript for all frontend code (no `any`). Python with type hints + ruff + mypy. Single-responsibility enforced by service-layer architecture. |
| **II. Simplicity** | ✅ PASS | Minimal dependency set — React Context + useReducer over Redux, SQLite over PostgreSQL, single Docker image. Each dependency has clear justification. |
| **III. UX Consistency** | ✅ PASS | Tailwind CSS design tokens for consistent styling. All interactive states (playing, stopped, reconnecting, offline, etc.) defined in spec. Fullscreen kiosk UI with minimal controls. |
| **IV. Performance** | ⚠️ CONDITIONAL | Photo format deviation: serving resized JPEG instead of WebP/AVIF (see Complexity Tracking). Bundle budget, memory leak prevention for WebSocket + timers, and virtualization requirements all achievable. LCP/TTI targets achievable on local network. |

**Gate Result**: PASS (one justified deviation documented below)

### Post-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality** | ✅ PASS | All models use Pydantic (Python) and TypeScript interfaces (frontend). No `any` types. Service layer enforces single responsibility: `channel_manager` for state, `photo_service` for photos, `scheduler` for timers. |
| **II. Simplicity** | ✅ PASS | Data model is minimal: one SQLite table, JSON-serialized arrays for sequence/history (avoids join complexity). WebSocket protocol has 3 client message types and 3 server message types. No unnecessary abstractions. |
| **III. UX Consistency** | ✅ PASS | All playback states defined as enum with distinct UI indicators. Settings panel, controls, and status bar have consistent placement. Tailwind design tokens in `tokens.css`. Error messages are user-facing (e.g., "No photos available", not stack traces). |
| **IV. Performance** | ⚠️ PASS (with deviation) | Photo resize is on-demand with disk cache — avoids startup delay. WebSocket broadcasts are O(clients) per channel. SQLite writes are <1ms. Bundle will be small (React + Tailwind + minimal deps). JPEG deviation justified in Complexity Tracking. Memory leak prevention: WebSocket hook cleans up on unmount, auto-advance tasks cancelled on stop. |

**Gate Result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, lifespan, static mount, WS endpoint
│   ├── config.py            # Pydantic Settings (env-based global config)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── channel.py       # Channel, ChannelConfig, PlaybackState schemas
│   │   ├── photo.py         # Photo metadata schema
│   │   └── messages.py      # WebSocket message schemas (inbound/outbound)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── channel_manager.py   # Channel lifecycle, state machine, sync
│   │   ├── photo_service.py     # Photo discovery, resize, EXIF extraction
│   │   ├── scheduler.py         # Daily stop scheduler, auto-advance timers
│   │   └── db.py                # aiosqlite persistence layer
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py            # REST endpoints (channels list, config, folders)
│   │   └── websocket.py         # WebSocket handler (connect, dispatch, broadcast)
│   └── db/
│       └── schema.sql           # SQLite DDL
├── tests/
│   ├── conftest.py
│   ├── unit/
│   └── integration/
├── pyproject.toml
└── py.typed

frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx      # Channel list, create-channel prompt
│   │   └── ChannelPage.tsx      # Fullscreen photo frame view
│   ├── components/
│   │   ├── PhotoViewer.tsx       # Fullscreen photo display + orientation
│   │   ├── PlaybackControls.tsx  # Play/Stop/Next/Prev/Reset buttons
│   │   ├── SettingsPanel.tsx     # Channel config editor
│   │   ├── StatusBar.tsx         # Channel ID, folder, delay, state indicator
│   │   └── PhotoInfo.tsx         # File name + date taken overlay
│   ├── context/
│   │   ├── ChannelContext.tsx    # React Context provider
│   │   └── channelReducer.ts    # useReducer state machine
│   ├── hooks/
│   │   ├── useWebSocket.ts      # WebSocket connect, reconnect, message dispatch
│   │   └── useFullscreen.ts     # Fullscreen API wrapper
│   ├── services/
│   │   └── api.ts               # REST client (channel list, folder browse, config)
│   └── styles/
│       └── tokens.css           # Tailwind design tokens (colors, spacing)
├── tests/
│   ├── unit/
│   └── integration/
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json

k8s/
├── kustomization.yaml
├── deployment.yaml
├── service.yaml
├── configmap.yaml               # Global config (timezone, photo size)
├── pv-nfs.yaml                  # NFS PersistentVolume (NAS photo library)
└── pvc-sqlite.yaml              # PVC for SQLite DB persistence

Dockerfile                       # Multi-stage: build frontend → copy into backend
```

**Structure Decision**: Web application with separate `backend/` and `frontend/` directories. Frontend is built via Vite in the Docker multi-stage build and served as static files by FastAPI. Single deployable image. K8s manifests in `k8s/` directory managed by Kustomize.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| JPEG served instead of WebP/AVIF (Constitution IV) | Source photos are JPEG from NAS. On-the-fly transcoding to WebP/AVIF adds CPU overhead per request and Pillow dependency complexity. Local network bandwidth is abundant (~50–200 KB per resized photo). | WebP conversion was evaluated: adds ~100ms per photo on resize, complicates caching, and provides negligible benefit on a local LAN where bandwidth is not constrained. |
