# Implementation Plan: Add Channel UI

**Branch**: `005-add-channel-ui` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-add-channel-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace the unfriendly "Navigate to URL" empty-state message with a proper channel creation flow: an "Add Channel" button on the home screen that opens a form with name input (validated against existing channel ID rules) and a folder browser (reusing the existing `GET /api/folders` endpoint). The backend `POST /api/channels` endpoint gains an optional `folder` field so the channel is created with photos ready. A Home button is added to the slideshow playback controls for navigation back to the channel list.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript 5.7 (frontend)
**Primary Dependencies (backend)**: FastAPI 0.115+, Uvicorn, Pillow, aiosqlite, Pydantic Settings
**Primary Dependencies (frontend)**: React 19, Vite 6, Tailwind CSS 3.4, Vitest 3
**Storage**: SQLite via aiosqlite (PVC-backed in k3s)
**Testing**: pytest + pytest-asyncio (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Docker on k3s (Linux); clients are Android tablets/phones via modern browser
**Project Type**: Web application (FastAPI backend serving React SPA + WebSocket real-time sync)
**Performance Goals**: Client-side route transitions <300ms, API responses <500ms p95
**Constraints**: Local network only, read-only NAS access, minimal bundle size impact (<5KB delta)
**Scale/Scope**: ~10 concurrent devices, 5+ channels, 10,000+ photos per folder

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality** | ✅ PASS | All new components use TypeScript with strict types. Backend changes use Pydantic models. No `any` types. Small, single-responsibility components (CreateChannelForm, FolderBrowser). |
| **II. Simplicity** | ✅ PASS | Reuses existing `fetchFolders` API and existing `createChannel` API (extended with optional field). No new abstractions, hooks, or state libraries. Form state is local React state. |
| **III. UX Consistency** | ✅ PASS | Uses existing design tokens (`framory-*` colors). Follows existing component patterns (buttons, inputs, overlays). Interactive states defined (loading, error, validation, empty). Folder browser pattern already exists in SettingsPanel. |
| **IV. Performance** | ✅ PASS | No new dependencies. Minimal bundle impact — two small components. No additional API calls at page load. Folder loading is on-demand. Route transition via existing `navigateTo` callback (<300ms). |

**Gate Result**: PASS

### Post-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality** | ✅ PASS | `CreateChannelForm` and `FolderBrowser` are typed React components with no `any`. Backend change adds one validated Pydantic field. Single responsibility maintained: `FolderBrowser` handles navigation, `CreateChannelForm` handles creation flow, `PlaybackControls` adds one callback. |
| **II. Simplicity** | ✅ PASS | `FolderBrowser` extraction justified — same stateful logic in `SettingsPanel` (~60 lines) would be duplicated otherwise. No new dependencies, hooks, or state libraries. Form state is plain `useState`. Backend change is one optional field + one optional parameter. |
| **III. UX Consistency** | ✅ PASS | All new UI uses `framory-*` design tokens. Home button follows existing `PlaybackControls` button pattern (same size, shape, color). Folder browser reuses the same visual pattern from SettingsPanel. All interactive states defined: loading (spinner), error (red message), validation (inline feedback), empty (informational message). |
| **IV. Performance** | ✅ PASS | No new dependencies → zero bundle impact beyond component code (~3–4KB uncompressed). Folder loading is on-demand (not at page load). Photo scan at channel creation is a one-time server-side operation. Route transitions use existing `navigateTo` / `goHome` callbacks (<300ms). |

**Gate Result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/005-add-channel-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── rest-api.md      # Updated POST /api/channels contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── routes.py            # MODIFIED – CreateChannelRequest gains optional `folder` field
│   ├── services/
│   │   └── channel_manager.py   # MODIFIED – create_channel() accepts optional folder param
│   └── models/
│       └── channel.py           # UNCHANGED – Channel already has folder field
└── tests/
    └── unit/
        └── test_create_channel.py   # NEW – unit tests for folder-at-creation

frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx      # MODIFIED – add "Add Channel" button + creation form
│   │   └── ChannelPage.tsx      # MODIFIED – accepts onHome prop, passes to PlaybackControls
│   ├── components/
│   │   ├── CreateChannelForm.tsx # NEW – channel name input + folder browser + validation
│   │   ├── FolderBrowser.tsx     # NEW – extracted/reusable folder picker (from SettingsPanel pattern)
│   │   ├── PlaybackControls.tsx  # MODIFIED – add Home button to controls row
│   │   └── SettingsPanel.tsx     # MODIFIED – refactored to use FolderBrowser component
│   ├── services/
│   │   └── api.ts               # MODIFIED – createChannel() accepts optional folder param
│   └── App.tsx                  # MODIFIED – pass goHome callback to ChannelPage, handle creation with folder
└── tests/
    └── unit/
        ├── CreateChannelForm.test.tsx  # NEW – form validation, submission, error states
        └── FolderBrowser.test.tsx      # NEW – folder navigation, selection, empty state
```

**Structure Decision**: Follows existing web application layout. Two new frontend components (`CreateChannelForm`, `FolderBrowser`) keep the Landing Page clean and maintain single-responsibility. `FolderBrowser` is extracted as its own component because the same browsing pattern already exists in `SettingsPanel` — this avoids duplicating folder-browsing logic (Constitution II: three-or-more rule applies since SettingsPanel will also consume it).

## Complexity Tracking

No violations. All changes fit within existing architecture patterns.
