# Tasks: Channel-Based Digital Photo Frame

**Input**: Design documents from `/specs/001-channel-photo-frame/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/websocket.md, contracts/rest-api.md, quickstart.md

**Tests**: Not explicitly requested — test tasks are excluded.

**Organization**: Tasks grouped by user story. User stories ordered by priority (P1 → P2 → P3). US8 (Channel Creation/Discovery) placed before US1/US2 because channel creation is the entry point for all other flows.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and skeleton for both backend and frontend

- [X] T001 Create project directory structure per plan.md (backend/, frontend/, k8s/ directories and all subdirectories)
- [X] T002 Initialize Python backend project with pyproject.toml including FastAPI, uvicorn, pillow, aiosqlite, pydantic-settings, pytest, pytest-asyncio, httpx, ruff, mypy as dependencies in backend/pyproject.toml
- [X] T003 [P] Initialize frontend project with Vite + React + TypeScript scaffold in frontend/ (package.json, tsconfig.json, vite.config.ts, index.html)
- [X] T004 [P] Configure backend linting and formatting: ruff.toml and mypy config section in backend/pyproject.toml
- [X] T005 [P] Install and configure Tailwind CSS with design tokens file in frontend/tailwind.config.ts and frontend/src/styles/tokens.css
- [X] T006 [P] Configure Vite dev proxy for /api and /ws to localhost:8000 in frontend/vite.config.ts
- [X] T007 [P] Create backend .env.example with all FRAMORY_* environment variables in backend/.env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure that ALL user stories depend on — database, config, models, photo service, WebSocket framework

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Implement Pydantic Settings config (GlobalConfig) with FRAMORY_* env vars, timezone validation via zoneinfo, defaults per data-model.md in backend/app/config.py
- [X] T009 Create SQLite DDL schema (channels table + updated_at trigger) in backend/app/db/schema.sql
- [X] T010 Implement aiosqlite persistence layer: init_db (create tables, enable WAL mode), get/save/list/delete channel operations, JSON serialization for history and sequence columns in backend/app/services/db.py
- [X] T011 [P] Define PlaybackState enum and Channel Pydantic model (matching all fields from data-model.md) in backend/app/models/channel.py
- [X] T012 [P] Define Photo metadata Pydantic model (path, filename, date_taken, date_modified, file_size) in backend/app/models/photo.py
- [X] T013 [P] Define WebSocket message schemas: inbound (CommandMessage, ConfigureMessage, PingMessage) and outbound (StateMessage, ErrorMessage, PongMessage) with type discriminator in backend/app/models/messages.py
- [X] T014 Implement PhotoService: scan_folder (os.scandir, JPEG filter, case-insensitive), generate_sequence (Fisher-Yates shuffle), get_photo_metadata (EXIF extraction via Pillow _getexif, tag 36867→306→file mtime fallback), resize_and_cache (exif_transpose + thumbnail + LANCZOS + quality 85, cache to GlobalConfig.cache_path with path-based key), path traversal validation in backend/app/services/photo_service.py
- [X] T015 Implement ChannelManager: in-memory channel state loaded from DB at startup, WebSocket client registry (dict[channel_id, set[WebSocket]]), register/unregister client, broadcast_state to all clients in channel, handle_command (play/stop/next/prev/reset state machine per data-model.md state transitions, validate folder non-empty on play per websocket contract), handle_configure (validate + apply + regenerate sequence on folder change) in backend/app/services/channel_manager.py
- [X] T016 Implement WebSocket handler: accept connection on /ws/{channel_id}, validate channel exists (close 4004 if not), register client, send initial state sync, message dispatch loop (parse JSON, route to handle_command/handle_configure/pong), handle disconnect + unregister, close codes 4004/4400 in backend/app/api/websocket.py
- [X] T017 Implement FastAPI app with lifespan (init DB, load channels into ChannelManager on startup; cleanup on shutdown), include API router, mount WebSocket endpoint in backend/app/main.py
- [X] T018 [P] Implement frontend ChannelContext provider and channelReducer: state shape (channelId, playbackState, photo, currentIndex, sequenceLength, hasPrevious, config, connectionStatus, seq), actions (SET_STATE, SET_CONNECTION_STATUS, SET_ERROR) in frontend/src/context/ChannelContext.tsx and frontend/src/context/channelReducer.ts
- [X] T019 [P] Implement useWebSocket hook: connect to ws://{host}/ws/{channelId}, parse incoming JSON messages, dispatch to channelReducer, send commands (play/stop/next/prev/reset/configure/ping), exponential backoff reconnection (1s/2s/4s/8s cap), visibilitychange listener for screen wake reconnect, expose connectionStatus (connected/reconnecting/offline) in frontend/src/hooks/useWebSocket.ts
- [X] T020 [P] Implement REST API client: fetchChannels (GET /api/channels), fetchChannel (GET /api/channels/{id}), createChannel (POST /api/channels), fetchFolders (GET /api/folders?path=) in frontend/src/services/api.ts

**Checkpoint**: Foundation ready — database initialized, models defined, photo service operational, WebSocket framework connected, frontend state management wired. User story implementation can now begin.

### Bugfixes

- [X] T064 [BUG] Fix GlobalConfig not loading .env file: add `env_file: ".env"` to `model_config` in backend/app/config.py — without this, pydantic-settings only reads OS environment variables, causing all config values to fall back to Docker-style defaults (/photos, /data/framory.db) during local development
- [X] T065 [BUG] Add tzdata dependency for Windows compatibility: the zoneinfo module on Windows requires the tzdata package for IANA timezone data — without it, ZoneInfo('Europe/Brussels') raises an exception, breaking timezone validation in GlobalConfig. Added tzdata>=2024.1 to backend/pyproject.toml dependencies

---

## Phase 3: User Story 8 - Channel Creation and Discovery (Priority: P1) 🎯 MVP

**Goal**: Landing page at root URL lists all channels; navigating to a non-existent channel shows a creation confirmation prompt; confirming creates the channel with defaults.

**Independent Test**: Visit root URL to see channel list. Navigate to `/?channel=new-test` and confirm creation. Verify channel appears in list.

### Implementation

- [X] T021 [US8] Implement REST routes: GET /api/channels (list all with client_count from ChannelManager), GET /api/channels/{id} (single channel detail), POST /api/channels (create with slug validation, 409 on duplicate, 422 on bad format), GET /api/health in backend/app/api/routes.py
- [X] T022 [US8] Register API router in FastAPI app (mount at /api prefix) in backend/app/main.py
- [X] T023 [US8] Implement LandingPage: fetch channel list on mount, display channels as selectable cards (id, folder, state, client_count), navigate to /?channel={id} on tap, show creation confirmation dialog when channel query param doesn't exist (with cancel→return to landing) in frontend/src/pages/LandingPage.tsx
- [X] T024 [US8] Implement App.tsx with client-side routing: root path → LandingPage, ?channel={id} → check if channel exists via GET /api/channels/{id}, if 404 show create prompt, if exists render ChannelPage in frontend/src/App.tsx
- [X] T025 [US8] Implement frontend main.tsx entry point rendering App with ChannelContext provider in frontend/src/main.tsx

**Checkpoint**: Channels can be created and discovered. Landing page is functional. Entry point for all other stories is established.

---

## Phase 4: User Story 1 - Single Tablet Slideshow (Priority: P1) 🎯 MVP

**Goal**: A single tablet opens a channel URL and sees a fullscreen slideshow of photos cycling automatically with visible controls on tap.

**Independent Test**: Create a channel, configure a photo folder, press Play. Verify photos display fullscreen and auto-advance. Tap screen to see controls + photo info. Press Stop/Next/Previous.

### Implementation

- [X] T026 [US1] Implement GET /api/channels/{channel_id}/photo endpoint: resolve current photo from channel sequence + index, call PhotoService.resize_and_cache, return JPEG binary with Cache-Control header, handle corrupt file (skip + auto-advance), 404 when no photo, 503 when NAS unreachable in backend/app/api/routes.py
- [X] T027 [US1] Implement auto-advance timer in ChannelManager: spawn asyncio.Task per playing channel (sleep for delay_seconds, trigger next, re-sleep loop), cancel on stop/pause, cancel+restart on manual next/prev (FR-014a), cancel+restart on delay_seconds config change in backend/app/services/channel_manager.py
- [X] T028 [US1] Implement PhotoViewer component: fullscreen photo display using <img> with object-fit:contain, load photo from state.photo.url (already includes ?v={seq} for cache-busting), use seq as React key on <img> to force DOM remount, handle loading/error states, tap-to-toggle controls overlay in frontend/src/components/PhotoViewer.tsx
- [X] T029 [P] [US1] Implement PlaybackControls component: Play/Stop/Next/Prev/Reset buttons, send commands via useWebSocket, disable Prev when hasPrevious=false (FR-016), visual state for playing/stopped in frontend/src/components/PlaybackControls.tsx
- [X] T030 [P] [US1] Implement PhotoInfo component: display current photo filename and date_taken (fallback to date_modified), shown in controls overlay in frontend/src/components/PhotoInfo.tsx
- [X] T031 [P] [US1] Implement StatusBar component: display channel ID, folder name, delay, stop time, and current playback state (playing/stopped_manual/stopped_scheduled/reconnecting/offline) with distinct visual indicators in frontend/src/components/StatusBar.tsx
- [X] T032 [US1] Implement ChannelPage: compose PhotoViewer + PlaybackControls + PhotoInfo + StatusBar, connect to ChannelContext, establish WebSocket connection via useWebSocket on mount, show "no photos available" message when photo is null in frontend/src/pages/ChannelPage.tsx
- [X] T033 [US1] Implement useFullscreen hook: request/exit fullscreen via Fullscreen API, expose isFullscreen state, handle vendor-prefixed APIs for older Android WebView in frontend/src/hooks/useFullscreen.ts
- [X] T034 [US1] Add swipe gesture support to ChannelPage: wrap PhotoViewer with react-swipeable — swipe left → next, swipe right → previous (FR-031) in frontend/src/pages/ChannelPage.tsx

**Checkpoint**: Single tablet end-to-end slideshow works. Photos display fullscreen, auto-advance, controls are functional, swipe gestures work. This is a testable MVP.

---

## Phase 5: User Story 2 - Multi-Tablet Synchronized Display (Priority: P1) 🎯 MVP

**Goal**: All tablets in the same channel show the same photo and advance together. Control actions on any tablet affect all tablets.

**Independent Test**: Open two browser tabs to the same channel. Press Next on one — both advance. Verify auto-advance keeps them in sync. Verify Stop on one stops both.

### Implementation

- [X] T035 [US2] Verify and harden broadcast_state in ChannelManager: ensure every state mutation (play, stop, next, prev, reset, auto-advance, configure) triggers broadcast to ALL registered WebSocket clients in the channel, include seq number for ordering. Note: concurrency locking is handled separately in T037 in backend/app/services/channel_manager.py
- [X] T036 [US2] Ensure ChannelPage reacts to externally-triggered state changes: when a state message arrives with a new seq, update photo URL (re-fetch photo), update all UI indicators (playback state, has_previous, index/total), handle rapid consecutive state updates gracefully in frontend/src/pages/ChannelPage.tsx
- [X] T037 [US2] Implement command serialization in ChannelManager: ensure concurrent commands from multiple clients on the same channel are processed sequentially via per-channel asyncio.Lock (first command wins, second operates on resulting state) in backend/app/services/channel_manager.py

**Checkpoint**: Multi-tablet sync verified. Two or more tabs stay in lock-step. Control actions propagate to all clients. Auto-advance is synchronized.

---

## Phase 6: User Story 7 - Late Join and Reconnection (Priority: P2)

**Goal**: A tablet joining mid-session gets the current photo instantly. Tablets that lose Wi-Fi reconnect and re-sync automatically.

**Independent Test**: Start a channel playing, advance several photos. Open a new tab — it should show the current photo immediately. Close/reopen the tab — same result. Simulate network disconnect by disabling Wi-Fi for 30 seconds, re-enable — tab re-syncs.

### Implementation

- [X] T038 [US7] Verify initial state sync on WebSocket connect: when a new client connects, ChannelManager sends full StateMessage (current photo, playback state, config, has_previous) immediately — already implemented in T016, verify it works for mid-session joins in backend/app/api/websocket.py
- [X] T039 [US7] Add reconnecting UI indicator to ChannelPage: when connectionStatus is "reconnecting", show overlay with reconnecting message; when "offline", show offline indicator; keep current photo displayed during reconnection (FR-032) in frontend/src/pages/ChannelPage.tsx
- [X] T040 [US7] Verify useWebSocket reconnection: ensure exponential backoff works correctly (1s→2s→4s→8s cap), visibilitychange triggers immediate reconnect, on reconnect the server sends fresh state and client jumps to current photo (not replaying missed transitions) in frontend/src/hooks/useWebSocket.ts

**Checkpoint**: Late join and reconnection are robust. New tabs sync instantly. Wi-Fi disconnects recover automatically with visual feedback.

---

## Phase 7: User Story 3 - Independent Channels (Priority: P2)

**Goal**: Multiple channels operate independently — different folders, delays, states. Actions on one channel never affect another.

**Independent Test**: Open two tabs with different channel IDs. Configure different folders. Play one, stop the other. Verify complete isolation.

### Implementation

- [X] T041 [US3] Verify channel isolation in ChannelManager: ensure client registry is keyed by channel_id, broadcast only targets clients in the affected channel, auto-advance timers are per-channel, state mutations only touch the target channel's DB row in backend/app/services/channel_manager.py
- [X] T042 [US3] Verify WebSocket endpoint scoping: each connection is bound to its channel_id path parameter, messages from one channel's clients never route to another channel's handler in backend/app/api/websocket.py
- [X] T043 [US3] Update LandingPage to show per-channel state indicators (playing/stopped, photo count, client count) to demonstrate multi-channel independence in frontend/src/pages/LandingPage.tsx

**Checkpoint**: Multiple channels run independently. No cross-channel interference.

---

## Phase 8: User Story 4 - Channel Configuration (Priority: P2)

**Goal**: Users can change channel settings (folder, delay, stop time) from the UI. Changes apply to all tablets in the channel.

**Independent Test**: Open settings panel, change folder — verify channel regenerates sequence and all tabs show new photos. Change delay — verify new timing takes effect.

### Implementation

- [X] T044 [US4] Implement GET /api/folders endpoint: browse NAS photo directories, return subfolders + photo_count for current path, validate path traversal (reject any path containing .. or resolving outside photo_root) in backend/app/api/routes.py
- [X] T045 [US4] Implement SettingsPanel component: folder browser (fetch /api/folders, navigate into subfolders, select folder), delay input (number, min 5), stop time input (HH:MM), send configure WebSocket message on save in frontend/src/components/SettingsPanel.tsx
- [X] T046 [US4] Integrate SettingsPanel into ChannelPage: toggle open/close from controls, pre-populate with current config from ChannelContext state in frontend/src/pages/ChannelPage.tsx

**Checkpoint**: Channel configuration is editable from UI. Folder changes regenerate sequence. Delay changes take effect on next advance. All tabs reflect changes.

---

## Phase 9: User Story 5 - Channel Reset (Priority: P3)

**Goal**: Reset generates a fresh random photo ordering, clears history, and all tablets show the new first photo. Previous is unavailable after reset.

**Independent Test**: Play a channel, advance several photos. Press Reset. Verify all tabs show a new first photo. Verify Previous is disabled. Advance once — Previous now works.

### Implementation

- [X] T047 [US5] Verify reset logic in ChannelManager: handle_command("reset") calls PhotoService.generate_sequence (reshuffle), clears history to [], sets current_index to 0, persists to DB, broadcasts new state, preserves current playback state (if playing stays playing) in backend/app/services/channel_manager.py
- [X] T048 [US5] Verify PlaybackControls Reset button behavior: after reset, hasPrevious=false so Prev button is disabled; after one advance, hasPrevious=true so Prev is re-enabled in frontend/src/components/PlaybackControls.tsx

**Checkpoint**: Reset works end-to-end. Fresh sequence, cleared history, all tabs in sync.

---

## Phase 10: User Story 6 - Daily Automatic Stop (Priority: P3)

**Goal**: Each channel auto-stops at its configured daily stop time. The stop is timezone-aware and DST-safe.

**Independent Test**: Set a channel's stop time to 1 minute in the future. Wait. Verify channel stops with "stopped (scheduled)" state on all tabs.

### Implementation

- [X] T049 [US6] Implement Scheduler service: background asyncio.Task running on 5-second interval, check all playing channels' stop_time against current wall-clock time in configured timezone (via zoneinfo.ZoneInfo), trigger stop with stopped_scheduled state, handle DST transitions correctly in backend/app/services/scheduler.py
- [X] T050 [US6] Start Scheduler in FastAPI lifespan (startup), cancel on shutdown in backend/app/main.py
- [X] T051 [US6] Handle stop_time config change edge case in ChannelManager: if new stop_time is already past for today and channel is playing, trigger immediate stop with stopped_scheduled in backend/app/services/channel_manager.py

**Checkpoint**: Daily auto-stop works. Timezone-aware. DST-safe. Config changes handled correctly.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Docker build, k8s deployment, static serving, edge cases, final hardening

- [X] T052 [P] Implement multi-stage Dockerfile: Stage 1 (node:20-slim) build frontend via npm ci + vite build, Stage 2 (python:3.14-slim) install backend deps into venv, Stage 3 (python:3.14-slim) copy venv + dist + backend source, expose port 8000, CMD uvicorn in Dockerfile
- [X] T053 [P] Mount frontend dist/ as FastAPI StaticFiles at "/" with html=True for SPA routing in backend/app/main.py
- [X] T054 [P] Create Kustomize k8s manifests: deployment.yaml (single replica, liveness/readiness probes on /api/health, volume mounts), service.yaml (ClusterIP port 8000), configmap.yaml (FRAMORY_* env vars), pv-nfs.yaml (static NFS PV for /photos read-only), pvc-sqlite.yaml (1Gi PVC for /data) in k8s/
- [X] T055 Handle edge case: empty or non-existent photo folder — return NO_PHOTOS error via WebSocket, display "no photos available" in ChannelPage UI in backend/app/services/channel_manager.py and frontend/src/pages/ChannelPage.tsx
- [X] T056 Handle edge case: corrupt/unreadable photo file — skip to next photo in sequence during resize_and_cache, log warning in backend/app/services/photo_service.py
- [X] T057 Handle edge case: NAS unreachable — photo endpoint returns 503, ChannelPage shows connectivity warning while keeping current photo displayed in backend/app/api/routes.py and frontend/src/pages/ChannelPage.tsx
- [X] T058 Handle edge case: all clients disconnect — ChannelManager stops the channel with stopped_no_clients state, persists current state to DB (FR-035a) in backend/app/services/channel_manager.py
- [X] T059 Run quickstart.md validation: verify local dev setup steps, Docker build, and k8s manifests produce working deployment
- [X] T060 [P] Implement touch interactive states for all interactive elements: active (touch feedback via :active pseudo-class + Tailwind), disabled (visual + aria-disabled for controls when not applicable), loading (spinner/pulse during async operations), error (inline error messages in plain language), empty (friendly empty states for channel list, photo viewer with no photos) per Constitution III in all frontend/src/components/
- [X] T061 [P] Add skeleton loaders and reserved-space placeholders for async content: photo loading placeholder (fixed aspect-ratio container to prevent layout shift), channel list loading skeleton, settings panel folder browser loading state — target CLS < 0.1 per Constitution III in frontend/src/components/
- [X] T062 [P] Configure bundle size budget: set Vite build warning at 150KB gzipped JS, add bundle analysis script (rollup-plugin-visualizer) to frontend/package.json, document budget in quickstart.md per Constitution IV in frontend/vite.config.ts and frontend/package.json
- [X] T063 [P] Verify FR-034 older device compatibility: test on low-end Android tablet (or Chrome DevTools throttled to mid-tier mobile), confirm photo loads without OOM, controls are responsive, fullscreen works with vendor-prefixed APIs, memory usage stays stable over 100+ photo advances in frontend/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US8)**: Depends on Phase 2 — creates channel entry point needed by US1
- **Phase 4 (US1)**: Depends on Phase 3 — needs channels to exist
- **Phase 5 (US2)**: Depends on Phase 4 — needs single-tablet playback working
- **Phase 6 (US7)**: Depends on Phase 4 — needs WebSocket connection working
- **Phase 7 (US3)**: Depends on Phase 4 — needs single-channel working to test isolation
- **Phase 8 (US4)**: Depends on Phase 4 — needs playback working to verify config changes
- **Phase 9 (US5)**: Depends on Phase 4 — needs playback + sequence working
- **Phase 10 (US6)**: Depends on Phase 4 — needs playback working for auto-stop
- **Phase 11 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational)
    │
    ▼
Phase 3 (US8: Channel Creation) ──────────────────────────────────┐
    │                                                              │
    ▼                                                              │
Phase 4 (US1: Single Tablet Slideshow) ◄──── core playback ───────┤
    │                                                              │
    ├──► Phase 5 (US2: Multi-Tablet Sync)                         │
    ├──► Phase 6 (US7: Late Join / Reconnect)                     │
    ├──► Phase 7 (US3: Independent Channels)                      │
    ├──► Phase 8 (US4: Channel Configuration)                     │
    ├──► Phase 9 (US5: Channel Reset)                             │
    └──► Phase 10 (US6: Daily Auto-Stop)                          │
                                                                   │
    All above ──► Phase 11 (Polish & Cross-Cutting) ◄─────────────┘
```

### Within Each User Story

- Backend service logic before API endpoints
- API endpoints before frontend components
- Core components before integration/composition
- All [P]-marked tasks within a phase can run in parallel

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006, T007 can all run in parallel after T001/T002
- **Phase 2**: T011, T012, T013 (models) can run in parallel; T018, T019, T020 (frontend foundational) can run in parallel
- **Phase 4**: T029, T030, T031 (UI components) can run in parallel after T028
- **Phase 6–10**: Once US1 is complete, US7, US3, US4, US5, US6 can proceed in parallel (different concerns, different files)
- **Phase 11**: T052, T053, T054 can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```
# Backend models — all different files, no deps:
T011: Channel model in backend/app/models/channel.py
T012: Photo model in backend/app/models/photo.py
T013: Message schemas in backend/app/models/messages.py

# Frontend foundational — all different files, no deps:
T018: ChannelContext + channelReducer
T019: useWebSocket hook
T020: REST API client
```

## Parallel Example: Phase 4 (US1 UI Components)

```
# After T028 (PhotoViewer) is done, these can run in parallel:
T029: PlaybackControls
T030: PhotoInfo
T031: StatusBar
```

---

## Implementation Strategy

### MVP First (US8 + US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: US8 (Channel Creation) — entry point exists
4. Complete Phase 4: US1 (Single Tablet Slideshow) — core experience works
5. Complete Phase 5: US2 (Multi-Tablet Sync) — defining feature works
6. **STOP and VALIDATE**: One channel, multiple tablets, photos cycling in sync
7. Deploy if ready — this is a usable product

### Incremental Delivery

1. Setup + Foundational → Framework ready
2. + US8 → Channels can be created and discovered
3. + US1 → Single tablet slideshow works end-to-end (MVP!)
4. + US2 → Multi-tablet sync (full MVP!)
5. + US7 → Reconnection resilience (production-ready)
6. + US3 → Multi-room support
7. + US4 → Configuration from UI
8. + US5 → Reset capability
9. + US6 → Daily auto-stop
10. + Polish → Docker, k8s, edge cases → Ship it

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [USn] label maps task to specific user story for traceability
- Each user story is independently testable at its checkpoint
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Edge cases are deferred to Phase 11 (Polish) to keep story phases focused on happy paths
