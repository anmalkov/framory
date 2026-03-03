# Tasks: Project Documentation

**Input**: Design documents from `/specs/002-project-documentation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not requested in the feature specification. No test tasks included.

**Organization**: Tasks are grouped by user story. Each user story produces one documentation file and can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create shared configuration files that enable editor feedback and are referenced by documentation files.

- [x] T001 Create markdownlint config file at `.markdownlint.json` — set MD013=false (no line-length limit), MD033=false (allow inline HTML for badges), MD024={"siblings_only":true} (allow duplicate headings in different sections). See research.md R3 for rationale.
- [x] T002 [P] Create MIT license file at `LICENSE` — use standard MIT license text with "Framory Contributors" as copyright holder and current year. See research.md R6.

**Checkpoint**: Editor markdownlint extension now provides real-time feedback. LICENSE file exists for README to reference.

---

## Phase 2: Foundational

**Purpose**: N/A — no blocking prerequisites for documentation writing. All user story phases can begin immediately after Setup.

---

## Phase 3: User Story 1 — README for First Impressions (Priority: P1) 🎯 MVP

**Goal**: A new visitor lands on the GitHub repo and within 2 minutes understands what Framory does, how to run it, and how to contribute.

**Independent Test**: Someone unfamiliar with the project reads only README.md and can answer: "What does this project do?", "How do I install it?", "How do I contribute?"

### Implementation for User Story 1

- [x] T003 [US1] Create `README.md` at repo root with all standard sections in this order: (1) title "Framory" + tagline + shields.io badges for license, Python, Node.js (FR-001, FR-008), (2) visual preview placeholder with instructions for adding a screenshot/GIF (FR-002), (3) Features bullet list — multi-device sync, channel-based display, NAS integration, kiosk UI, WebSocket real-time sync, configurable slideshow timing (FR-003), (4) Quick Start section with Docker run command referencing docs/development.md for full setup (FR-004), (5) Documentation section linking to docs/usage.md, docs/development.md, docs/architecture.md (FR-005), (6) Contributing section with link to dev guide + branch naming and PR conventions (FR-006), (7) License section stating MIT with link to LICENSE file (FR-007). Use scannable headings, no implementation jargon in overview (FR-009). Source info from: backend/pyproject.toml, frontend/package.json, Dockerfile, backend/app/config.py.

**Checkpoint**: README.md is complete. A visitor can understand the project and find all documentation links. MVP deliverable.

---

## Phase 4: User Story 2 — Developer Onboarding Guide (Priority: P1)

**Goal**: A developer goes from zero to a fully working local dev environment by following step-by-step instructions.

**Independent Test**: A developer with Python and Node.js follows the guide on a clean machine and successfully runs both backend and frontend with passing tests.

### Implementation for User Story 2

- [x] T004 [US2] Create `docs/development.md` with all sections: (1) Prerequisites — Python 3.12+, Node.js 20+, Docker, with version check commands (FR-017), (2) Backend Setup — create venv, activate, pip install -e ".[dev]", explain config via environment variables and backend/app/config.py defaults (FR-018), (3) Frontend Setup — cd frontend, npm install, explain VITE_API_URL env var (FR-019), (4) Running Locally — start backend with `uvicorn app.main:app --reload`, start frontend with `npm run dev`, explain Vite proxy config from frontend/vite.config.ts (FR-020), (5) Testing — pytest for backend unit/integration tests, vitest for frontend tests, ruff check/mypy --strict for backend linting, eslint for frontend linting (FR-021), (6) Debugging — uvicorn --reload for auto-restart, browser DevTools for frontend, Vite HMR for hot reload (FR-022), (7) Docker Build — docker build command from Dockerfile, docker run with volume mounts and port mapping (FR-023), (8) Project Structure — directory tree with descriptions of backend/, frontend/, k8s/, specs/ (FR-024), (9) Code Style & Conventions — ruff rules, mypy strict mode, eslint config, naming conventions (FR-025). Source info from: backend/pyproject.toml, frontend/package.json, frontend/vite.config.ts, Dockerfile, backend/tests/conftest.py, backend/app/config.py.

**Checkpoint**: docs/development.md is complete. A developer can set up, run, test, debug, and build the project.

---

## Phase 5: User Story 3 — Architecture Understanding (Priority: P2)

**Goal**: A developer or technical stakeholder understands the system design, component interactions, and key architectural decisions through visual diagrams and written explanations.

**Independent Test**: A developer reads docs/architecture.md and can correctly describe the main components, how a photo is displayed on a tablet, and how multi-device sync works.

### Implementation for User Story 3

- [x] T005 [US3] Create `docs/architecture.md` with all sections: (1) High-Level Architecture — Mermaid `graph TD` diagram showing Browser Clients, FastAPI Backend (REST API + WebSocket), SQLite Database, NFS Photo Storage; written explanation of each component (FR-026, FR-027), (2) Sequence Diagrams — three Mermaid `sequenceDiagram` blocks: (a) Client Connection & Initial Sync — WebSocket connect, channel state load, broadcast current state (FR-028), (b) Photo Advance Flow — scheduler timer fires, PhotoService selects next photo, broadcast to all clients (FR-029), (c) Playback Command Flow — user taps play/stop, command sent via WebSocket, ChannelManager updates state, broadcast to all (FR-030), (3) Data Model — Channel entity (name, current_photo, playback state, photo_folder, delay, stop_time), playback states (playing/stopped), photo metadata from PhotoService (FR-031), (4) Architectural Decisions — table with decisions and rationale: SQLite over Postgres (single-instance, no external DB), WebSocket over SSE (bidirectional needed), JPEG-only serving via Pillow, single-instance design, in-memory channel state with DB persistence (FR-032), (5) Deployment Architecture — Mermaid diagram showing k8s pod with FastAPI container, NFS PersistentVolume (read-only photos), PVC for SQLite, k8s Service, ConfigMap for env vars (FR-033). Source info from: backend/app/api/websocket.py, backend/app/api/routes.py, backend/app/services/channel_manager.py, backend/app/services/photo_service.py, backend/app/services/scheduler.py, backend/app/services/db.py, backend/app/models/channel.py, backend/app/db/schema.sql, k8s/deployment.yaml, k8s/configmap.yaml, k8s/pv-nfs.yaml, k8s/pvc-sqlite.yaml.

**Checkpoint**: docs/architecture.md is complete with 4+ Mermaid diagrams that render on GitHub.

---

## Phase 6: User Story 4 — User Manual for Day-to-Day Usage (Priority: P2)

**Goal**: A non-technical user (family member) can operate Framory — create channels, connect devices, control playback, and adjust settings — by following a plain-language guide.

**Independent Test**: A non-technical person follows docs/usage.md and successfully creates a channel, opens it on a tablet, controls playback, and changes settings without any other documentation.

### Implementation for User Story 4

- [x] T006 [US4] Create `docs/usage.md` with all sections in plain non-technical language (FR-016): (1) Introduction — brief explanation that Framory turns any browser into a synchronized digital photo frame, scope of this guide (FR-010), (2) Creating a Channel — navigate to Framory landing page in browser, enter a channel name, explain what a channel is in simple terms (FR-011), (3) Connecting a Device — open the channel URL on a tablet/phone browser, tap to go fullscreen, explain the URL pattern (FR-012), (4) Controlling Playback — explain play, stop, next, previous controls: tap screen to reveal overlay buttons, swipe left for next photo, swipe right for previous photo (FR-013), (5) Settings — open settings panel, change photo folder path, adjust delay between photos (seconds), set daily stop time so the frame turns off automatically (FR-014), (6) Multi-Device Sync — explain that all devices on the same channel show the same photo simultaneously, any device can control playback and all others follow (FR-015). Avoid all technical jargon — no "WebSocket", "API", "server", etc. Source info from: frontend/src/components/PlaybackControls.tsx, frontend/src/components/SettingsPanel.tsx, frontend/src/pages/ChannelPage.tsx, frontend/src/pages/LandingPage.tsx, frontend/src/components/PhotoViewer.tsx.

**Checkpoint**: docs/usage.md is complete. A non-technical user can operate Framory from this guide alone.

---

## Phase 7: User Story 5 — Documentation Quality Gate (Priority: P3)

**Goal**: An automated CI check validates markdown formatting on every push/PR that touches documentation files, and does not run for code-only changes.

**Independent Test**: Introduce a deliberate formatting error in a doc file → CI fails. Push a code-only change → CI does not trigger.

### Implementation for User Story 5

- [x] T007 [US5] Create `.github/workflows/docs-lint.yml` — GitHub Actions workflow with: (1) name "Lint Documentation", (2) triggers: push to main + pull_request, both with paths filter for `docs/**`, `README.md`, `.markdownlint.json` (FR-035), (3) single job: checkout repo, run `DavidAnson/markdownlint-cli2-action@v22` with globs `README.md docs/*.md` (FR-034). The action automatically uses `.markdownlint.json` from repo root. See research.md R2 for configuration details.

**Checkpoint**: CI pipeline is configured. Documentation quality is enforced automatically.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate all documentation files work together, pass lint, and cross-references are correct.

- [x] T008 Run `npx markdownlint-cli2 "README.md" "docs/*.md"` locally and fix any violations across all documentation files
- [x] T009 Validate all cross-references between documentation files — confirm README.md links to docs/usage.md, docs/development.md, docs/architecture.md all resolve; confirm LICENSE link in README resolves; run quickstart.md validation checklist

**Checkpoint**: All documentation files pass lint and all internal links resolve correctly.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: N/A — skipped for this documentation feature
- **US1 README (Phase 3)**: Depends on Setup (T001, T002) — LICENSE must exist for License section link
- **US2 Development Guide (Phase 4)**: Depends on Setup (T001) — no dependency on US1
- **US3 Architecture (Phase 5)**: Depends on Setup (T001) — no dependency on US1/US2
- **US4 Usage Manual (Phase 6)**: Depends on Setup (T001) — no dependency on US1/US2/US3
- **US5 Quality Gate (Phase 7)**: Depends on Setup (T001) — .markdownlint.json must exist; best done after all docs are written so the CI validates real content
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Setup. Links to docs/usage.md, docs/development.md, docs/architecture.md — these files don't need to exist yet for the links to be written.
- **US2 (P1)**: Depends only on Setup. Fully independent of US1.
- **US3 (P2)**: Depends only on Setup. Fully independent of US1, US2, US4.
- **US4 (P2)**: Depends only on Setup. Fully independent of US1, US2, US3.
- **US5 (P3)**: Depends only on Setup. Best sequenced after US1–US4 so the workflow validates actual content.

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phases 3–6**: US1, US2, US3, US4 are all independent files — all four can run in parallel after Setup completes
- **Phase 7**: Should run after US1–US4 for best validation, but technically only depends on Phase 1
- **Phase 8**: Must run after all user stories complete

---

## Parallel Example: All User Stories

```text
# After Setup (Phase 1) completes, launch all doc files in parallel:
T003: [US1] Create README.md
T004: [US2] Create docs/development.md
T005: [US3] Create docs/architecture.md
T006: [US4] Create docs/usage.md

# Then sequentially:
T007: [US5] Create .github/workflows/docs-lint.yml
T008: Run markdownlint and fix violations
T009: Validate cross-references
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 3: US1 — README.md (T003)
3. **STOP and VALIDATE**: README renders correctly on GitHub, all sections present
4. The project now has a professional front door

### Incremental Delivery

1. Setup → README.md (MVP — project has a landing page)
2. + docs/development.md → Developers can onboard
3. + docs/architecture.md → Technical understanding available
4. + docs/usage.md → Non-technical users can operate Framory
5. + docs-lint.yml → Quality gate prevents docs degradation
6. Polish → All docs validated and cross-linked

### Parallel Strategy

With multiple workers after Setup:
- Worker A: README.md (US1)
- Worker B: docs/development.md (US2)
- Worker C: docs/architecture.md (US3)
- Worker D: docs/usage.md (US4)
- Then: docs-lint.yml (US5) → Polish
