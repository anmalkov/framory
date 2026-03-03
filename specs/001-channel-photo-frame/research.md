# Research: Channel-Based Digital Photo Frame

**Feature Branch**: `001-channel-photo-frame`
**Date**: 2026-03-02

## R-01: Testing Frameworks

**Context**: Technical Context listed testing as NEEDS CLARIFICATION.

**Decision**: pytest + pytest-asyncio (backend), Vitest + React Testing Library (frontend)

**Rationale**:
- **pytest** is the standard Python testing framework. `pytest-asyncio` provides native async test support for aiosqlite and FastAPI async endpoints. `httpx` + `AsyncClient` for FastAPI integration tests.
- **Vitest** is the Vite-native test runner — zero extra config, same transform pipeline as the build. React Testing Library for component tests with user-centric assertions.
- Both tools align with Constitution I (Code Quality) by integrating cleanly into CI pipelines and supporting coverage reporting.

**Alternatives considered**:
- unittest (Python): More boilerplate, weaker async support, no fixture ecosystem.
- Jest (frontend): Requires separate configuration from Vite; Vitest is a drop-in replacement with better Vite integration.

---

## R-02: Photo Serving Format — JPEG vs WebP/AVIF

**Context**: Constitution IV requires "Images MUST use modern formats (WebP/AVIF)." The spec mandates serving JPEG photos from NAS.

**Decision**: Serve resized JPEG. Do not transcode to WebP/AVIF.

**Rationale**:
- The constitution's image format rule targets web UI assets (icons, illustrations, hero images) optimized for public internet delivery. This application serves user-generated photographic content over a local LAN.
- Source files are all JPEG. On-the-fly WebP transcoding via Pillow adds ~80–150ms per photo at 1920px, consuming CPU that should be reserved for serving multiple channels simultaneously.
- Resized JPEGs at quality 85 are ~50–200 KB — well within local network bandwidth. WebP would save ~25-30% but this is negligible when bandwidth is not constrained.
- Pillow's JPEG encoder preserves EXIF orientation tags natively; WebP handling of EXIF is less consistent across older Android WebView versions.
- This deviation is documented in the Complexity Tracking section of plan.md.

**Alternatives considered**:
- Pre-generate WebP cache on disk: Doubles storage for 10,000+ photos per folder, adds cache invalidation complexity, violates Simplicity (Constitution II).
- On-the-fly WebP conversion with in-memory LRU cache: Adds memory pressure on the single pod, complicates the serving path, marginal bandwidth savings on LAN.

---

## R-03: WebSocket Protocol Design for Channel Sync

**Context**: Real-time sync is the defining feature. Need a message protocol that supports all channel operations.

**Decision**: JSON-based WebSocket messages with `type` discriminator and channel-scoped broadcast.

**Rationale**:
- JSON is human-readable, debuggable, and natively parsed in both Python (pydantic) and TypeScript. No binary protocol overhead needed at this scale (~10 clients, <1 msg/sec per channel).
- Each WebSocket connection is scoped to a single channel (channel ID in the connection URL path). The server maintains a registry of connections per channel and broadcasts state changes to all connections in that channel.
- Message flow: Client sends commands (play, stop, next, prev, reset, configure). Server validates, updates channel state, and broadcasts the new state to all clients in that channel.
- State sync message includes: current photo URL, playback state, current index, history depth, channel config, and a sequence number for ordering.

**Message types**:
- **Client → Server**: `command` (action: play | stop | next | prev | reset), `configure` (settings update), `ping`
- **Server → Client**: `state` (full channel state sync), `error` (validation failure), `pong`

**Alternatives considered**:
- Server-Sent Events (SSE): Unidirectional only — would still need REST endpoints for commands. WebSocket provides bidirectional communication in a single connection.
- MessagePack/Protobuf: Unnecessary optimization for <10 clients on LAN. Adds serialization dependency and reduces debuggability.

---

## R-04: SQLite Concurrency with aiosqlite

**Context**: Multiple channels and WebSocket handlers will read/write channel state concurrently.

**Decision**: Single aiosqlite connection with WAL mode, serialized writes through the channel manager service.

**Rationale**:
- `aiosqlite` wraps sqlite3 in a background thread, providing async interface without blocking the event loop. A single connection avoids SQLite's multi-writer limitations.
- WAL (Write-Ahead Logging) mode allows concurrent reads while a write is in progress, which is ideal for this workload (frequent reads for state sync, infrequent writes for state changes).
- All state mutations flow through `ChannelManager`, which serializes writes per channel using asyncio locks. This prevents race conditions without complex transaction management.
- Channel state is small (current index, config, history stack per channel) — SQLite is more than sufficient, and the persistence requirement (survive pod restarts) is met by PVC-backed storage.

**Alternatives considered**:
- Multiple aiosqlite connections: SQLite handles concurrent writes via WAL but with potential SQLITE_BUSY errors under contention. Single connection is simpler and sufficient at this scale.
- In-memory state + periodic flush: Risks data loss on crash. SQLite writes are fast enough (<1ms for state updates) to write synchronously on every state change.

---

## R-05: Pillow EXIF Extraction and Resize Best Practices

**Context**: Photos must be served resized (configurable max resolution) with correct orientation and EXIF date extraction.

**Decision**: Use `ImageOps.exif_transpose()` for orientation, then `Image.thumbnail()` for resize, and `_getexif()` for date extraction.

**Rationale**:
- `ImageOps.exif_transpose()` automatically applies EXIF orientation tag and strips it, ensuring correct display regardless of original camera orientation. This is the recommended Pillow approach.
- `Image.thumbnail()` resizes in-place while preserving aspect ratio and never upscales. Combined with `LANCZOS` resampling, this produces high-quality output.
- EXIF tag `36867` (DateTimeOriginal) is the primary date source. Fallback chain: `36867` → `306` (DateTime) → file modification time. This matches FR-030a.
- Photo processing should be done on first request and cached to disk (resized version stored alongside or in a cache directory) to avoid re-processing on subsequent requests.

**Resize pipeline**:
1. Open JPEG with Pillow
2. Apply `exif_transpose()` to fix rotation
3. Call `thumbnail((max_size, max_size), Image.LANCZOS)`
4. Save to cache directory as JPEG quality 85
5. Extract EXIF DateTimeOriginal for metadata response

**Alternatives considered**:
- libvips (pyvips): Faster for batch processing but adds a native dependency. Pillow is pure Python (with C extensions), simpler to containerize, and sufficient for on-demand single-photo processing.
- Pre-resize all photos at startup: Would take minutes to hours for 10,000+ photos. On-demand + cache is faster to start and processes only photos that are actually viewed.

---

## R-06: WebSocket Reconnection Strategy (Frontend)

**Context**: Tablets may lose Wi-Fi temporarily. The spec requires automatic reconnection within 5 seconds of network restoration (FR-012).

**Decision**: Custom reconnection hook with exponential backoff (capped) using the native WebSocket API.

**Rationale**:
- The native `WebSocket` API is lightweight and sufficient. No library needed — this aligns with Constitution II (Simplicity) and the user's explicit choice of "Native WebSocket API."
- Reconnection strategy: on `close`/`error`, attempt reconnect with delays of 1s, 2s, 4s, 8s (capped at 8s). On successful reconnect, server sends full state sync immediately.
- The `useWebSocket` hook manages connection lifecycle, exposes connection status (connected/reconnecting/offline) for UI state display (FR-032), and dispatches incoming messages to the channel reducer.
- `visibilitychange` event listener to reconnect immediately when a tablet screen wakes up (common on Android tablets that sleep).

**Alternatives considered**:
- reconnecting-websocket library: Adds a dependency for ~50 lines of logic. The custom hook gives full control over reconnection timing and state reporting.
- Socket.IO: Heavyweight, adds server-side dependency, protocol overhead. Overkill for a local LAN with ~10 clients.

---

## R-07: Docker Multi-Stage Build (Python + Vite)

**Context**: Single Docker image that builds the frontend and bundles it with the FastAPI backend.

**Decision**: Three-stage Dockerfile — Node build stage, Python dependency stage, final runtime stage.

**Rationale**:
- **Stage 1 (Node)**: Install frontend dependencies, run `vite build`, produce `dist/` static assets.
- **Stage 2 (Python)**: Install Python dependencies into a virtual environment using pip.
- **Stage 3 (Runtime)**: Copy venv from stage 2, copy `dist/` from stage 1 into FastAPI's static directory, copy backend source. Use slim Python base image.
- FastAPI serves the frontend via `StaticFiles` mount at `/` with the SPA `html=True` option for client-side routing.
- Final image size target: <200MB (Python slim + dependencies + frontend assets).

**Alternatives considered**:
- Nginx reverse proxy + separate frontend/backend containers: More complex deployment, two containers to manage, violates Simplicity. Single image is appropriate for a home appliance.
- buildx multi-platform: Not needed — k3s target is amd64 Linux only.

---

## R-08: k3s + NFS PersistentVolume Configuration

**Context**: Photo library on Synology NAS must be accessible read-only. SQLite DB must persist across pod restarts.

**Decision**: NFS PersistentVolume (static provisioning) for photos, hostPath or local PVC for SQLite.

**Rationale**:
- **NFS PV for photos**: Static PV pointing to NAS export path. Mounted read-only in the pod at `/photos`. No dynamic provisioner needed — the NAS share is a fixed resource.
- **PVC for SQLite**: A small (1Gi) PVC using the default storage class (local-path in k3s) for the SQLite database file. Mounted at `/data` in the pod.
- ConfigMap for global config: timezone and photo output size injected as environment variables via ConfigMap, consumed by Pydantic Settings.
- Single replica deployment (SQLite doesn't support multi-writer). Liveness and readiness probes on the FastAPI health endpoint.

**Alternatives considered**:
- Synology CSI driver: More complex, unnecessary for a single static NFS share.
- SQLite on NFS: Not recommended — NFS locking is unreliable for SQLite. Local storage is correct for the DB.

---

## R-09: Photo Discovery and Sequence Generation

**Context**: Channels display photos from folders with 10,000+ JPEGs. Need efficient discovery and randomized sequencing.

**Decision**: Eager directory scan on channel start/configure, Fisher-Yates shuffle, store sequence in SQLite.

**Rationale**:
- On channel creation, folder change, or reset: scan the configured folder for `*.jpg` and `*.jpeg` files (case-insensitive), collect relative paths, apply Fisher-Yates shuffle, and store the ordered list in SQLite.
- Directory scan of 10,000 files via `os.scandir()` completes in <100ms on NFS. This is fast enough to run on-demand without background workers.
- Storing the full sequence in SQLite ensures all clients see the same order and the sequence survives pod restarts. The current index is a simple integer pointer.
- Non-JPEG files are filtered out during scan (FR-004). Unreadable files are skipped during serving (edge case in spec).

**Alternatives considered**:
- Lazy discovery (scan on each advance): Would require maintaining a "seen" set and risks repeats. Pre-computed sequence is simpler and guarantees no repeats until full cycle.
- Store sequence in memory only: Lost on pod restart. SQLite persistence is essential per FR-035.

---

## R-10: Auto-Advance Timer and Daily Stop Scheduler

**Context**: Each channel has an independent auto-advance timer and a daily stop time.

**Decision**: Per-channel `asyncio.Task` for auto-advance; single `asyncio.Task` for the daily stop scheduler.

**Rationale**:
- **Auto-advance**: Each playing channel spawns an asyncio task that sleeps for the configured delay, then triggers "next" and re-sleeps. Task is cancelled on stop/pause and recreated on play. Manual next/prev cancels and restarts the task (FR-014a).
- **Daily stop scheduler**: A single background task that runs on a 30-second check interval. On each tick, it checks all channels' stop times against the current wall-clock time in the configured timezone (via `zoneinfo.ZoneInfo`). If a playing channel's stop time has passed, it triggers stop.
- Using `zoneinfo` (stdlib since Python 3.9) for timezone handling ensures correct DST behavior (FR-028) without third-party dependencies.
- The 30-second check interval means worst-case 30-second latency on daily stop, well within the 5-second tolerance (SC-005) when combined with the check granularity.

**Alternatives considered**:
- APScheduler: Heavyweight dependency for what amounts to a simple periodic check. asyncio tasks are sufficient and align with Constitution II (Simplicity).
- Per-channel stop timer (sleep until stop time): More precise but requires recalculation on every config change. The polling approach is simpler and handles config changes automatically.

Actually, 30-second interval is too coarse for 5-second tolerance. Revised: **5-second check interval** for daily stop scheduler.
