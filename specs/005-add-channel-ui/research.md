# Research: Add Channel UI

**Feature**: 005-add-channel-ui  
**Date**: 2026-03-04

## Research Task 1: Backend Channel Creation with Folder

**Context**: The spec requires that channels are created with a folder already configured (FR-011). Currently `POST /api/channels` only accepts `{id}` and sets `folder` to the empty default. Folder is set later via WebSocket `configure` message.

**Decision**: Extend `CreateChannelRequest` with an optional `folder: str | None = None` field. When provided, `channel_manager.create_channel()` accepts an optional `folder` parameter, validates the path (same traversal checks as `handle_configure`), sets the folder, and triggers an initial photo scan so the sequence is populated before the first WebSocket connection.

**Rationale**: This is the minimal change — one optional Pydantic field, one optional function parameter. It preserves backward compatibility (existing callers that omit `folder` get the current behavior). The validation logic already exists in `handle_configure` and `browse_folders`.

**Alternatives considered**:
- Two-step flow (POST + immediate WebSocket configure): More complex client logic, race condition between channel creation redirect and WebSocket connection. Rejected.
- New endpoint `POST /api/channels/{id}/folder`: Unnecessary API surface for a one-time setup action. Rejected.

## Research Task 2: FolderBrowser Component Extraction

**Context**: `SettingsPanel` already contains folder browsing logic (fetch folders, navigate into subfolder, navigate up, display photo count, select folder). The new `CreateChannelForm` needs the same capability. Constitution Principle II requires extraction when the same logic appears in 3+ locations, but here it's exactly 2 consumers.

**Decision**: Extract a standalone `FolderBrowser` component that encapsulates folder navigation state and the `fetchFolders` API call. Both `SettingsPanel` and `CreateChannelForm` will use it. The component accepts an `onSelect(path: string)` callback and an optional `initialPath` prop.

**Rationale**: Even though Constitution II's "three or more" extraction rule isn't technically triggered, the folder browsing logic is ~60 lines of stateful code (useState for path, loading, folders, photo count; useEffect for fetching; navigation handlers). Duplicating this would create a maintenance burden and divergence risk. The extraction is justified by measurable complexity reduction.

**Alternatives considered**:
- Custom hook `useFolderBrowser()`: Returns state + handlers but still requires duplicated JSX for rendering. Incomplete extraction. Rejected.
- Copy-paste from SettingsPanel: Violates DRY, creates divergence risk. Rejected.

## Research Task 3: Channel Name Validation Pattern

**Context**: Channel names must match `^[a-z0-9][a-z0-9-]*[a-z0-9]$` (2–50 chars). The spec requires real-time validation feedback (FR-004).

**Decision**: Validate on every keystroke (controlled input). Display validation state below the input:
- Empty: no message shown
- Valid: subtle green checkmark or no indicator
- Invalid: red message explaining the specific issue (too short, invalid characters, starts/ends with hyphen)
The same regex from the backend is replicated as a constant in the frontend. Auto-lowercase the input (transform on change).

**Rationale**: Keystroke validation is idiomatic React (controlled component pattern). Auto-lowercasing removes a common user error. The regex is simple enough that frontend/backend duplication is acceptable (no shared validation library needed).

**Alternatives considered**:
- Validate only on blur: Delays feedback, worse UX. Rejected.
- Server-side validation only: Requires async round-trip on each keystroke. Rejected.
- Debounced validation: Unnecessary complexity for a simple regex check. Rejected.

## Research Task 4: Home Navigation from Slideshow

**Context**: The spec requires a Home button in the playback controls bar (FR-012). Currently `ChannelPage` is rendered by `App.tsx` which manages view state. The `goHome` callback already exists in `App.tsx` (`goHome` sets view to `{ kind: "landing" }` and pushes `/` to history).

**Decision**: Thread `goHome` from `App.tsx` → `ChannelPage` (as a new prop) → `PlaybackControls` (as a new `onHome` prop). Add a Home icon button (🏠 or similar) to the left side of the PlaybackControls button row.

**Rationale**: Follows the existing callback-prop pattern used for other actions (onPlay, onStop, onNext, etc.). Placing Home at the left end of the controls row provides clear visual separation from playback actions and matches the "back to start" mental model.

**Alternatives considered**:
- Status bar link: StatusBar is for display info (channel name, photo info), not navigation actions. Rejected.
- Separate floating button: Inconsistent with existing controls pattern (Constitution III). Rejected.
- Top-left back arrow overlay: Would interfere with the current tap-to-show-controls overlay behavior. Rejected.
