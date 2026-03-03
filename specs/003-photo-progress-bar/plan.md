# Implementation Plan: Photo Transition Progress Bar

**Branch**: `003-photo-progress-bar` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-photo-progress-bar/spec.md`

## Summary

Add a thin, semi-transparent progress line at the very bottom edge of the viewport that animates from left to right over the configured `delay_seconds`, resetting on each photo transition. The animation is driven entirely client-side using CSS transitions keyed to the delay value received via WebSocket. A new per-channel boolean setting `show_progress_bar` (default: true) is persisted in the SQLite database, exposed through the existing WebSocket state/configure protocol, and toggled via the settings panel. No new API endpoints, components beyond one `ProgressBar` component, or third-party dependencies are needed.

## Technical Context

**Language/Version**: Python 3.14+ (backend), TypeScript (frontend)
**Primary Dependencies (backend)**: FastAPI, Uvicorn, Pillow, aiosqlite, Pydantic Settings
**Primary Dependencies (frontend)**: React 19, Vite 6, Tailwind CSS 3, react-swipeable
**Storage**: SQLite via aiosqlite (PVC-backed in k3s)
**Testing**: pytest + pytest-asyncio (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Docker on k3s; clients are Android tablets/phones via modern browser
**Project Type**: Web application (FastAPI backend + React SPA + WebSocket real-time sync)
**Performance Goals**: Smooth 60fps animation on mid-tier tablets, no layout shifts, no stutter on photo transitions
**Constraints**: Must use CSS transitions (not JS `requestAnimationFrame`) for GPU-accelerated smoothness on low-power tablets. No new dependencies. Must work within existing WebSocket protocol.
**Scale/Scope**: Single new component + settings toggle; touches ~10 existing files with small additions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality** | ✅ PASS | New `ProgressBar` component will be fully typed. Backend model change adds typed Pydantic field. No `any` usage. |
| **II. Simplicity** | ✅ PASS | Pure CSS transition approach — no animation library, no requestAnimationFrame loop, no server-side timer sync endpoint. Single boolean setting with sensible default (true). |
| **III. UX Consistency** | ✅ PASS | Uses design token `--color-progress` for color (semi-transparent white). Fixed position at viewport bottom — no layout shift (CLS = 0). All states handled: playing (animate), stopped (hidden), no photos (hidden). |
| **IV. Performance** | ✅ PASS | CSS `width` transition with `linear` timing is GPU-compositable. No JS animation loop — zero main-thread cost during animation. No bundle size increase (no new deps). Timer cleanup on unmount prevents memory leaks. |

**Gate Result**: PASS — no violations.

### Post-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality** | ✅ PASS | `ProgressBar.tsx` fully typed with props interface. Backend `show_progress_bar` is a typed Pydantic field (`bool`). No `any` usage. Single-responsibility: ProgressBar only renders the line, ChannelPage composes it. |
| **II. Simplicity** | ✅ PASS | One new component (ProgressBar), one new DB column, one new field on existing models. CSS transition for animation — no animation library. `key={seq}` pattern for reset — no refs or manual DOM manipulation. No new dependencies, no new abstractions. |
| **III. UX Consistency** | ✅ PASS | Uses `--color-progress` design token (semi-transparent white) from `tokens.css` + `framory-progress` Tailwind key. No layout shift (CLS = 0) — fixed position overlay. Settings toggle follows existing SettingsPanel patterns. All states handled: playing (animate), stopped (hidden), no photos (hidden). |
| **IV. Performance** | ✅ PASS | CSS-only animation — zero main-thread cost. No memory leaks: component cleanup via React lifecycle (`key` remount). No bundle size increase (no new deps). Single `div` element with CSS transition — trivial DOM cost. |

**Gate Result**: PASS — no violations. No changes from pre-design check.

## Project Structure

### Documentation (this feature)

```text
specs/003-photo-progress-bar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── websocket.md     # Updated WebSocket protocol
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── routes.py            # ADD: show_progress_bar to REST responses
│   ├── models/
│   │   ├── channel.py           # ADD: show_progress_bar field
│   │   └── messages.py          # ADD: show_progress_bar to ChannelConfig + ConfigureSettings
│   ├── services/
│   │   ├── channel_manager.py   # ADD: handle show_progress_bar in configure + broadcast
│   │   └── db.py                # ADD: show_progress_bar to save/load queries
│   └── db/
│       └── schema.sql           # ADD: show_progress_bar column
└── tests/
    └── unit/                    # ADD: tests for new field

frontend/
├── tailwind.config.ts           # ADD: framory-progress color token
├── src/
│   ├── components/
│   │   ├── ProgressBar.tsx      # NEW: progress bar component
│   │   └── SettingsPanel.tsx    # ADD: toggle for show_progress_bar
│   ├── context/
│   │   └── channelReducer.ts    # ADD: show_progress_bar to ChannelConfig/state
│   ├── hooks/
│   │   └── useWebSocket.ts      # ADD: show_progress_bar to ConfigureSettings
│   ├── pages/
│   │   └── ChannelPage.tsx      # ADD: render ProgressBar
│   └── styles/
│       └── tokens.css           # ADD: --color-progress custom property
└── tests/
    └── unit/                    # ADD: ProgressBar tests

docs/
├── architecture.md              # ADD: ProgressBar component, show_progress_bar setting
└── usage.md                     # ADD: progress bar toggle in Settings section
```

**Structure Decision**: No new directories needed. One new component file (`ProgressBar.tsx`), the rest are modifications to existing files. Follows the established project layout.

## Complexity Tracking

No constitution violations — table is empty.
