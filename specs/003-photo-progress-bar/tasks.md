# Tasks: Photo Transition Progress Bar

**Input**: Design documents from `/specs/003-photo-progress-bar/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/websocket.md ✅, quickstart.md ✅

**Tests**: Required per constitution Quality Gates §3 — new behavior MUST include corresponding tests.

**Organization**: Tasks grouped by user story (US1: progress bar animation, US2: settings toggle).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Schema & Backend Model)

**Purpose**: Database migration and backend model changes that both user stories depend on

- [x] T001 Add `show_progress_bar` column to `backend/app/db/schema.sql` in the CREATE TABLE statement with `INTEGER NOT NULL DEFAULT 1`
- [x] T002 Add `ALTER TABLE` migration in `backend/app/services/db.py` inside `init_db()` to add the column to existing databases (catch duplicate-column error)
- [x] T003 Add `show_progress_bar` to the INSERT/UPSERT query in `save_channel()` in `backend/app/services/db.py`

---

## Phase 2: Foundational (Backend + Frontend Model Plumbing)

**Purpose**: Wire `show_progress_bar` through the full backend→WebSocket→frontend data pipeline so both user stories can consume it

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Add `show_progress_bar: bool = True` field to the `Channel` model in `backend/app/models/channel.py`
- [x] T005 [P] Add `show_progress_bar: bool` to `ChannelConfig` and `show_progress_bar: bool | None = None` to `ConfigureSettings` in `backend/app/models/messages.py`
- [x] T006 Add `show_progress_bar` to `ChannelConfig(...)` construction in `broadcast_state()` and `send_state_to()` in `backend/app/services/channel_manager.py`
- [x] T007 Add `show_progress_bar` handling to `handle_configure()` in `backend/app/services/channel_manager.py` — read from settings dict and assign to channel if provided
- [x] T008 [P] Add `show_progress_bar: boolean` to the `ChannelConfig` interface and `show_progress_bar: true` to `initialChannelState.config` in `frontend/src/context/channelReducer.ts`
- [x] T009 [P] Add `show_progress_bar?: boolean` to the `ConfigureSettings` interface in `frontend/src/hooks/useWebSocket.ts`

**Checkpoint**: `show_progress_bar` flows end-to-end: DB → Channel model → WebSocket state → frontend state → configure back to server. Ready for UI work.

---

## Phase 3: User Story 1 — Progress Bar Animation (Priority: P1) 🎯 MVP

**Goal**: Display a thin animated progress line at the bottom of the viewport that grows from left to right over `delay_seconds`, resets on each photo change, and is hidden when not playing.

**Independent Test**: Open a channel, start playback, observe the line animate at the bottom of the screen in sync with the photo timer. Swipe next — line resets. Stop playback — line disappears.

### Implementation for User Story 1

- [x] T010 [US1] Add a `--color-progress` CSS custom property to `frontend/src/styles/tokens.css` (value: `rgba(255, 255, 255, 0.4)`) and a corresponding `progress` key under `framory` in `frontend/tailwind.config.ts`
- [x] T011 [US1] Create `ProgressBar` component in `frontend/src/components/ProgressBar.tsx` — accepts `durationSeconds: number` and `isPlaying: boolean` props; renders a 2px-tall fixed-bottom div with CSS transition on width from 0% to 100% over the configured duration; uses the `bg-framory-progress` design token; z-index above photo but below control overlays
- [x] T012 [US1] Render `ProgressBar` in `frontend/src/pages/ChannelPage.tsx` — pass `durationSeconds={state.config.delay_seconds}`, `isPlaying={state.playbackState === "playing"}`, and `` key={`${state.seq}-${state.config.delay_seconds}`} `` to auto-reset on photo change or delay change; conditionally render only when `state.config.show_progress_bar` is true and `state.photo` exists
- [x] T013 [P] [US1] Add unit test for `ProgressBar` in `frontend/tests/unit/ProgressBar.test.tsx` — test that it renders when `isPlaying` is true, is hidden when `isPlaying` is false, applies correct transition duration, and uses the design token class

**Checkpoint**: User Story 1 is fully functional — progress line animates, resets, and hides correctly.

---

## Phase 4: User Story 2 — Toggle Progress Bar Visibility in Settings (Priority: P2)

**Goal**: Add a toggle in the settings panel to show/hide the progress bar, persisted per channel.

**Independent Test**: Open settings, toggle "Show progress bar" off — line disappears. Toggle on — line reappears. Refresh page — setting persists.

### Implementation for User Story 2

- [x] T014 [US2] Add `show_progress_bar` prop and `onSave` support in `frontend/src/components/SettingsPanel.tsx` — add `currentShowProgressBar: boolean` to props interface; add local state and a toggle switch styled consistently with existing controls; include `show_progress_bar` in the settings object passed to `onSave`
- [x] T015 [US2] Pass `show_progress_bar` through from `ChannelPage.tsx` to `SettingsPanel` — add `currentShowProgressBar={state.config.show_progress_bar}` prop and ensure `onSave` callback includes `show_progress_bar` in the `sendConfigure()` call

**Checkpoint**: User Stories 1 AND 2 are both fully functional. Settings toggle controls progress bar visibility and persists across reloads.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [x] T016 Add `show_progress_bar` to REST API responses in `backend/app/api/routes.py` — include the field in `list_channels`, `get_channel`, and `create_channel` response dicts for API consistency
- [x] T017 [P] Add backend unit test in `backend/tests/unit/test_show_progress_bar.py` — test that `show_progress_bar` defaults to true on new channels, round-trips through `save_channel`/`get_channel`, and is included in `ChannelConfig` and `ConfigureSettings` messages
- [x] T018 Update documentation in `docs/usage.md` — add "Show Progress Bar" to the Settings section describing the toggle and its default-on behavior; mention the progress line briefly in the Controlling Playback section. Update `docs/architecture.md` — add `ProgressBar` to the Components list and mention the `show_progress_bar` channel setting in the Data Model section
- [x] T019 Run `quickstart.md` verification steps end-to-end (progress line animation, settings toggle, playback states, page refresh persistence)
- [x] T020 Verify edge cases: delay change mid-animation resets line, no-photos channel shows no line, scheduled stop hides line, window resize adapts line width

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (schema must exist before model uses it)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (needs `show_progress_bar` in frontend state)
- **User Story 2 (Phase 4)**: Depends on Phase 2 (needs `show_progress_bar` in config pipeline). Independent of Phase 3.
- **Polish (Phase 5)**: Depends on Phases 3 and 4

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on US2
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — no dependency on US1
- US1 and US2 **can run in parallel** since they touch different files (ProgressBar.tsx vs SettingsPanel.tsx)

### Within Each Phase

- Phase 1: T001 → T002 → T003 (sequential — each builds on prior schema/query change)
- Phase 2: T004, T005, T008, T009 can run in parallel [P]; T006 and T007 depend on T004+T005
- Phase 3: T010 → T011 → T012 (token, then component, then ChannelPage renders it); T013 in parallel [P]
- Phase 4: T014 → T015 (SettingsPanel must accept prop before ChannelPage passes it)

### Parallel Opportunities

```text
# After Phase 1 completes, launch all [P] foundational tasks together:
T004: Channel model (backend)
T005: Message models (backend)
T008: channelReducer (frontend)
T009: useWebSocket types (frontend)

# After Phase 2 completes, both user stories can start in parallel:
T010: Design token (US1)
T011: ProgressBar component (US1)
T014: SettingsPanel toggle (US2)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T009)
3. Complete Phase 3: User Story 1 (T010–T013)
4. **STOP and VALIDATE**: Progress line animates correctly
5. Deliverable: working progress bar with default visibility

### Incremental Delivery

1. Setup + Foundational → Data pipeline ready
2. Add User Story 1 → Progress bar works → MVP!
3. Add User Story 2 → Settings toggle works → Feature complete
4. Polish → Edge cases verified → Ready to merge

---

## Notes

- Total tasks: **20**
- Tasks per user story: US1 = 4 (incl. design token + unit test), US2 = 2, Setup = 3, Foundational = 6, Polish = 5 (incl. REST API + backend test + docs)
- Parallel opportunities: 4 foundational tasks in parallel, 2 user stories in parallel, US1 unit test in parallel with ChannelPage integration
- No new dependencies added to package.json or pyproject.toml
- REST API responses updated for consistency alongside WebSocket protocol
