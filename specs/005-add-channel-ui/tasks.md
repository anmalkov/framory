# Tasks: Add Channel UI

**Input**: Design documents from `/specs/005-add-channel-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rest-api.md, quickstart.md

**Tests**: Included — the existing project has tests and the plan references test files.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Backend API extension and frontend API client update — shared by all user stories

- [x] T001 Add optional `folder` field to `CreateChannelRequest` in backend/app/api/routes.py
- [x] T002 Add optional `folder` parameter to `channel_manager.create_channel()` in backend/app/services/channel_manager.py with folder validation (path traversal check, directory existence under photo_root) and photo sequence generation
- [x] T003 Update `create_channel` route handler in backend/app/api/routes.py to pass `req.folder` to `channel_manager.create_channel()` and return 400 on invalid folder
- [x] T004 [P] Update `createChannel()` in frontend/src/services/api.ts to accept optional `folder` parameter and include it in request body

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract FolderBrowser component — shared by US1/US3 and future SettingsPanel refactor

**⚠️ CRITICAL**: CreateChannelForm depends on this component

- [x] T005 Create `FolderBrowser` component in frontend/src/components/FolderBrowser.tsx — encapsulate folder navigation state (currentPath, folders, photoCount, parentPath, loading, error), fetch via `fetchFolders()`, render folder list with navigation into subfolders, back to parent, photo count display, and `onSelect(path: string)` callback; support `initialPath` prop; include all interactive states (loading spinner, error message, empty state for no folders); ensure keyboard navigability (arrow keys/Enter for folder selection), ARIA attributes (role, aria-label on interactive elements), and focus management (auto-focus list on open)
- [x] T006 Refactor `SettingsPanel` in frontend/src/components/SettingsPanel.tsx to use the new `FolderBrowser` component instead of inline folder browsing logic

**Checkpoint**: FolderBrowser is reusable — user story implementation can begin

---

## Phase 3: User Story 1 — Create Channel from Home Screen (Priority: P1) 🎯 MVP

**Goal**: Replace the "Navigate to URL" empty-state message with an "Add Channel" button that opens a creation form with name input and folder selection. On submit, channel is created with folder and user is redirected.

**Independent Test**: Open home screen with no channels → click "Add Channel" → fill name + select folder → submit → verify redirect to new channel's slideshow view.

### Tests for User Story 1

- [x] T007 [P] [US1] Create unit test for `CreateChannelForm` in frontend/tests/unit/CreateChannelForm.test.tsx — test name validation (too short, invalid chars, valid), folder selection required, submit disabled until valid, submit success redirects, submit error (409 duplicate) shows error without clearing form, cancel calls onCancel, browser-back/popstate discards form state and returns to home screen
- [x] T008 [P] [US1] Create unit test for `FolderBrowser` in frontend/tests/unit/FolderBrowser.test.tsx — test initial load shows folders, navigate into subfolder, navigate back to parent, select folder calls onSelect, empty state when no folders, loading state, error state
- [x] T009 [P] [US1] Create unit test for backend channel creation with folder in backend/tests/unit/test_create_channel.py — test create with valid folder sets folder and populates sequence, create with invalid folder (path traversal) returns 400, create with nonexistent folder returns 400, create without folder uses default (backward compat)

### Implementation for User Story 1

- [x] T010 [US1] Create `CreateChannelForm` component in frontend/src/components/CreateChannelForm.tsx — channel name input (auto-lowercase, real-time validation against `^[a-z0-9][a-z0-9-]*[a-z0-9]$` 2–50 chars), folder selector button that opens FolderBrowser, selected folder display with photo count, Create button (disabled until valid name + folder selected), Cancel button, submitting state (spinner on Create button), error display for server errors (409 duplicate, other), trim whitespace on name before validation; ensure keyboard navigability (Tab through inputs/buttons, Enter to submit), aria-labels on all inputs and buttons, focus management (auto-focus name input on mount, return focus to trigger on cancel)
- [x] T011 [US1] Update `LandingPage` in frontend/src/pages/LandingPage.tsx — replace the "No channels yet" text with an "Add Channel" button in the empty state, wire button to show CreateChannelForm, pass `onCreateChannel` callback that calls `createChannel(id, folder)` and then `onSelectChannel(id)` for redirect
- [x] T012 [US1] Update `App.tsx` in frontend/src/App.tsx — add `create-channel` view kind alongside existing `create-prompt`, handle `onCreateChannel` from LandingPage that calls `createChannel(id, folder)` API then navigates to the new channel; keep URL-based creation (`/?channel=name`) as a backward-compatible fallback

**Checkpoint**: User Story 1 complete — users can create a channel with folder from empty home screen and get redirected

---

## Phase 4: User Story 2 — Add Channel When Channels Already Exist (Priority: P2)

**Goal**: The "Add Channel" button is always visible on the home screen, not just in empty state.

**Independent Test**: Create a channel → return to home → verify "Add Channel" button visible below channel list → click and create a second channel.

### Implementation for User Story 2

- [x] T013 [US2] Update `LandingPage` in frontend/src/pages/LandingPage.tsx — add "Add Channel" button below the channel list (visible when channels.length > 0), reuse the same CreateChannelForm toggle and creation flow from US1

**Checkpoint**: "Add Channel" button visible in both empty and populated home screen states

---

## Phase 5: User Story 3 — Browse and Select a Photo Folder (Priority: P2)

**Goal**: Folder picker in the creation form lets users browse folders, navigate into subfolders, see photo counts, and select a folder.

**Independent Test**: Open creation form → open folder browser → navigate into subfolder → see photo count → go back up → select a folder → verify folder path and photo count shown in form.

*Note: The core FolderBrowser component was created in Phase 2 (T005). This phase ensures it integrates correctly with CreateChannelForm and handles all edge cases.*

### Implementation for User Story 3

- [x] T014 [US3] Verify FolderBrowser integration in CreateChannelForm — ensure selecting a folder populates the form's selectedFolder and photoCount, ensure FolderBrowser opens/closes properly via showFolderBrowser state, ensure "Change Folder" allows re-selection
- [x] T015 [US3] Handle edge case: empty photo root (no folders available) — FolderBrowser shows informational message, Create button remains disabled

**Checkpoint**: Full folder browsing and selection flow works end-to-end in channel creation

---

## Phase 6: User Story 4 — Navigate Home from Slideshow (Priority: P2)

**Goal**: A Home button in the slideshow playback controls navigates back to the channel list.

**Independent Test**: Open a channel's slideshow → tap to show controls → verify Home button visible → click Home → verify navigation to `/` showing channel list.

### Implementation for User Story 4

- [x] T016 [P] [US4] Add `onHome` prop to `PlaybackControls` in frontend/src/components/PlaybackControls.tsx — add a Home icon button (🏠) at the left side of the controls row, same styling as other control buttons (h-12 w-12, rounded-full, bg-framory-surface); include `aria-label="Navigate to home screen"` and keyboard support (focusable, Enter/Space to activate)
- [x] T017 [US4] Update `ChannelPage` in frontend/src/pages/ChannelPage.tsx — accept `onHome` prop, pass it to `PlaybackControls` as `onHome`; no explicit stop command needed before navigation — WebSocket disconnect on component unmount handles playback cleanup server-side (satisfies US4 acceptance scenario 3)
- [x] T018 [US4] Update `App.tsx` in frontend/src/App.tsx — pass `goHome` callback to `ChannelPage` as `onHome` prop

**Checkpoint**: Users can navigate from any channel's slideshow back to the home screen in one click

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T019 [P] Run `npm run lint` and `npm run build` in frontend/ — fix any lint or type errors; verify bundle size delta is under 5KB (Constitution IV budget)
- [x] T020 [P] Run `ruff check` and `mypy` in backend/ — fix any lint or type errors
- [x] T021 Run all tests: `pytest` in backend/ and `npm test` in frontend/ — verify all pass
- [x] T022 Run accessibility audit on new components (CreateChannelForm, FolderBrowser, Home button) — verify keyboard navigation, ARIA attributes, focus management, and color contrast meet WCAG 2.1 AA (Constitution III + Quality Gate 5)
- [x] T023 Run quickstart.md validation — follow all steps in specs/005-add-channel-ui/quickstart.md and verify feature works end-to-end
- [x] T024 Update project documentation to reflect 005-add-channel-ui changes — update docs/usage.md (replace URL-based channel creation with Add Channel button flow, add Home button to controls list, mention folder selection during creation), update docs/development.md (add new files to project structure: FolderBrowser.tsx, CreateChannelForm.tsx, test files), update docs/architecture.md (add CreateChannelForm and FolderBrowser to Browser Clients description, update REST API description to mention folder param on channel creation)
- [x] T025 Replace Unicode emoji icons in PlaybackControls with react-icons (io5) — install react-icons, replace all ControlButton icons (Home, Previous, Play, Stop, Next, Reset, Settings) with IoHome, IoPlayBack, IoPlay, IoStop, IoPlayForward, IoRefresh, IoSettings; change ControlButton icon prop type from string to React.ReactNode
- [x] T026 Auto-hide playback controls overlay when Play is clicked — update ChannelPage onPlay handler to call setShowControls(false) after sendCommand("play") so the controls dismiss immediately when the slideshow starts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: T005 depends on T004 (api.ts fetchFolders already exists, but FolderBrowser uses it). T006 can proceed after T005.
- **User Story 1 (Phase 3)**: Depends on Phase 1 (T001–T004) and Phase 2 (T005). Tests (T007–T009) can start in parallel with T005.
- **User Story 2 (Phase 4)**: Depends on US1 (T011 creates the form toggle in LandingPage; T013 extends it)
- **User Story 3 (Phase 5)**: Depends on Phase 2 (T005) and US1 (T010 creates CreateChannelForm)
- **User Story 4 (Phase 6)**: Depends only on Phase 1 setup — can run in parallel with US1/US2/US3
- **Polish (Phase 7)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Setup + Foundational — **MVP**
- **US2 (P2)**: Depends on US1 (extends LandingPage from US1)
- **US3 (P2)**: Depends on Foundational + US1 (extends CreateChannelForm from US1)
- **US4 (P2)**: Independent of other user stories — only depends on existing ChannelPage/PlaybackControls

### Parallel Opportunities

- T001, T002, T003 are sequential (backend API chain)
- T004 can run in parallel with T001–T003 (different codebase: frontend)
- T007, T008, T009 can all run in parallel (test files, no shared dependencies)
- T016 can run in parallel with any US1/US2/US3 work (different component)
- T019, T020 can run in parallel (different codebases)

---

## Parallel Example: Phase 1 + 2

```text
# Sequential backend chain:
T001 → T002 → T003

# In parallel with backend:
T004 (frontend api.ts)

# After T004:
T005 (FolderBrowser) → T006 (SettingsPanel refactor)
```

## Parallel Example: User Story Tests

```text
# All three test files can be written simultaneously:
T007 (CreateChannelForm.test.tsx)
T008 (FolderBrowser.test.tsx)
T009 (test_create_channel.py)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T006)
3. Complete Phase 3: User Story 1 (T007–T012)
4. **STOP and VALIDATE**: Test US1 independently — create channel from empty home screen
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → API ready, FolderBrowser reusable
2. Add US1 → Channel creation from empty state → MVP!
3. Add US2 → "Add Channel" always visible → fuller experience
4. Add US3 → Folder browsing edge cases polished
5. Add US4 → Home navigation from slideshow → full navigation loop
6. Polish → Lint, tests, quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
