# Feature Specification: Add Channel UI

**Feature Branch**: `005-add-channel-ui`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Now if there is no channels user see 'No channels yet. Navigate to /?channel=my-channel to create one.' I want to make adding a new channel more user friendly. On the home screen there should be a button to add a new channel. When user clicks — user should provide a new name and select a folder. The new channel will be created and user will be redirected to that channel."

## User Scenarios & Testing

### User Story 1 - Create Channel from Home Screen (Priority: P1)

A user opens the app and sees no channels (or has existing channels and wants a new one). Instead of manually editing the URL, they click an "Add Channel" button on the home screen. A form appears where they type a channel name and browse/select a photo folder. After submitting, the channel is created and the user is automatically redirected to the new channel's photo frame view.

**Why this priority**: This is the core ask — replacing the unfriendly "navigate to URL" message with an intuitive creation flow. Without it, the feature has no value.

**Independent Test**: Can be fully tested by opening the home screen, clicking "Add Channel", filling in a name, selecting a folder, and verifying the channel is created and the view redirects to it.

**Acceptance Scenarios**:

1. **Given** the user is on the home screen with no channels, **When** they click the "Add Channel" button, **Then** a channel creation form is displayed with fields for channel name and folder selection.
2. **Given** the channel creation form is displayed, **When** the user enters a valid channel name and selects a folder and submits, **Then** the channel is created and the user is redirected to the new channel's view.
3. **Given** the channel creation form is displayed, **When** the user enters an invalid channel name (e.g., too short, invalid characters), **Then** a validation message is shown and the form is not submitted.
4. **Given** the channel creation form is displayed, **When** the user enters a name that already exists, **Then** an error message is shown indicating the channel already exists.
5. **Given** the channel creation form is displayed, **When** the user clicks cancel or dismisses the form, **Then** the form closes and the user returns to the home screen with no changes.

---

### User Story 2 - Add Channel When Channels Already Exist (Priority: P2)

A user who already has one or more channels wants to add another one. The "Add Channel" button is always visible on the home screen (not just when the channel list is empty), so the user can create additional channels at any time.

**Why this priority**: Ensures the feature is useful beyond the first-time experience and supports multi-channel setups.

**Independent Test**: Can be tested by creating a first channel, returning to the home screen, clicking "Add Channel" again, and verifying a second channel is created successfully.

**Acceptance Scenarios**:

1. **Given** the user is on the home screen with one or more existing channels, **When** they look at the page, **Then** an "Add Channel" button is visible alongside the channel list.
2. **Given** the user clicks "Add Channel" when channels already exist, **When** the creation form appears, **Then** the user can create a new channel with a unique name and folder, and is redirected to it.

---

### User Story 3 - Browse and Select a Photo Folder (Priority: P2)

When creating a channel, the user needs to select which photo folder the channel should display. The folder picker shows the available folders under the server's photo root and lets the user navigate into subfolders. The user selects a folder and sees how many photos it contains before confirming.

**Why this priority**: Folder selection is integral to channel creation — without it, the channel has no photos to display.

**Independent Test**: Can be tested by opening the folder picker during channel creation, navigating into a subfolder, seeing the photo count, and selecting the folder.

**Acceptance Scenarios**:

1. **Given** the channel creation form is displayed, **When** the user interacts with the folder selector, **Then** a folder browser shows the top-level folders available under the photo root.
2. **Given** the folder browser is open, **When** the user selects a subfolder, **Then** the browser navigates into that subfolder showing its children and photo count.
3. **Given** the folder browser is showing a subfolder, **When** the user wants to go back, **Then** they can navigate to the parent folder.
4. **Given** the user has navigated to a folder with photos, **When** they confirm the folder selection, **Then** the selected folder path is populated in the creation form and the photo count is displayed.

---

### User Story 4 - Navigate Home from Slideshow (Priority: P2)

A user is viewing a channel's slideshow and wants to go back to the home screen to switch channels or create a new one. In the playback controls bar (alongside play/stop, next, previous, and settings), there is a Home link. Clicking it navigates the user back to the channel list at the root path.

**Why this priority**: Without a way to return home from the slideshow, users must manually edit the URL. This complements the new channel creation flow by making the full navigation loop intuitive.

**Independent Test**: Can be tested by opening a channel's slideshow, locating the Home link in the controls bar, clicking it, and verifying the browser navigates to the home screen showing the channel list.

**Acceptance Scenarios**:

1. **Given** the user is viewing a channel's slideshow, **When** they look at the playback controls, **Then** a Home link/button is visible alongside the existing controls (play/stop, next, previous, settings).
2. **Given** the user clicks the Home link in the playback controls, **When** the navigation completes, **Then** the user is on the home screen at `/` showing the list of channels.
3. **Given** the user clicks the Home link while the slideshow is playing, **When** they are redirected home, **Then** the slideshow stops for that client and the home screen loads normally.
4. **Given** the user taps the screen to reveal playback controls and clicks Play, **When** the play command is sent, **Then** the controls overlay automatically hides and the slideshow begins playing without requiring a second tap to dismiss.

---

### Edge Cases

- What happens when the user enters a channel name with leading/trailing spaces? Spaces are trimmed before validation.
- What happens when the photo root has no folders at all? The folder browser shows an empty state with a message indicating no folders are available, and the user cannot submit the form without selecting a folder.
- What happens if the server returns an error during channel creation? An error message is displayed on the form and the user can retry.
- What happens if the user navigates away (browser back) during creation? The form state is discarded and the user returns to the home screen.

## Requirements

### Functional Requirements

- **FR-001**: The home screen MUST display an "Add Channel" button, visible both when no channels exist and when channels already exist.
- **FR-002**: Clicking the "Add Channel" button MUST present a channel creation form with a channel name input and a folder selector.
- **FR-003**: The channel name input MUST validate that the name is 2–50 characters and matches the allowed format (lowercase alphanumeric and hyphens, not starting or ending with a hyphen).
- **FR-004**: The channel name input MUST show real-time validation feedback as the user types.
- **FR-005**: The folder selector MUST allow the user to browse available folders under the photo root using the existing folder browsing capability.
- **FR-006**: The folder selector MUST display the photo count for the currently viewed folder.
- **FR-007**: The form MUST NOT allow submission until both a valid channel name and a folder are provided.
- **FR-008**: On successful channel creation, the system MUST redirect the user to the newly created channel's view.
- **FR-009**: If channel creation fails (e.g., duplicate name, server error), the system MUST show an error message on the form without discarding user input.
- **FR-010**: The creation form MUST provide a way to cancel and return to the home screen.
- **FR-011**: The channel MUST be created with the selected folder already configured, so photos begin loading immediately upon redirect.
- **FR-012**: The channel slideshow view MUST include a Home link in the playback controls that navigates the user to the home screen (`/`).
- **FR-013**: All playback control icons MUST use a consistent icon library (react-icons/io5) instead of Unicode emoji symbols, ensuring uniform visual weight and style across all control buttons.
- **FR-014**: When the user clicks Play in the playback controls, the controls overlay MUST automatically hide so the slideshow view is unobstructed without requiring a second tap.

### Key Entities

- **Channel**: A named photo-frame display context. Key attributes: unique name (ID), associated photo folder path, playback state.
- **Folder**: A directory under the photo root containing photos. Key attributes: name, path relative to photo root, photo count, child folders.

> **Terminology note**: "Channel name" throughout this spec maps to the `id` field in the backend `CreateChannelRequest` model and the `channel_id` parameter — the name IS the unique identifier.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a new channel from the home screen in under 30 seconds without needing to manually edit the URL.
- **SC-002**: 100% of channel creations via the UI result in the user being redirected to the new channel's view with the selected folder already configured.
- **SC-003**: Users receive immediate feedback on invalid input (name format, missing folder) before form submission is attempted.
- **SC-004**: The "Add Channel" button is discoverable on the home screen in both empty-state and populated-state layouts.
- **SC-005**: Users can navigate from any channel's slideshow back to the home screen in a single click.

## Assumptions

- The existing backend folder browsing endpoint (`GET /api/folders`) is sufficient for the folder picker UI; no new backend endpoints are needed for folder browsing.
- The existing channel creation endpoint will be extended or a new field added to accept the folder path at creation time, so the channel is created with the folder already set.
- Channel names follow the existing validation rules: 2–50 lowercase alphanumeric characters and hyphens, not starting or ending with a hyphen.
- The folder selector only needs to show folders under the configured photo root; users do not need to browse arbitrary filesystem paths.
- The creation form is part of the home screen flow (inline or modal) — no separate page/route is needed.
- The existing URL-based channel creation flow (`/?channel=name`) remains as a backward-compatible fallback and is not removed.
