# Feature Specification: Channel-Based Digital Photo Frame

**Feature Branch**: `001-channel-photo-frame`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "Design a home digital photo frame system for Android tablets with channel-based synchronized display of JPEG library from Synology NAS"

> **Terminology**: Throughout this spec, "tablet" refers to any device with a browser — tablets, phones, or any other screen. Phones are equally supported as channel clients and controllers.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single Tablet Slideshow (Priority: P1)

A family member places an Android tablet on a shelf, opens its browser, navigates to the photo frame URL with a channel ID, and sees a fullscreen slideshow of family photos cycling automatically. The photos are sourced from a large JPEG library stored on the home NAS, served through a central service — the tablet never accesses the NAS directly.

**Why this priority**: This is the core value proposition — turning any Android tablet into a digital photo frame with zero app installation. Without this, no other feature matters.

**Independent Test**: Can be fully tested with one tablet, one channel, and one photo folder. Delivers a working photo frame experience end-to-end.

**Acceptance Scenarios**:

1. **Given** a tablet with a browser on the local network, **When** the user opens the photo frame URL with a channel ID (e.g., `http://framory.local/?channel=living-room`), **Then** the tablet displays photos fullscreen and auto-advances using the channel's configured delay.
2. **Given** a channel with a configured photo folder containing 10,000 JPEGs, **When** the slideshow is playing, **Then** photos load and display smoothly without visible lag or out-of-memory errors on older Android tablets.
3. **Given** a tablet displaying a slideshow, **When** the user taps the screen, **Then** playback controls (Play, Stop, Next, Previous, Reset, Settings) become visible along with the current photo's file name and date taken.
4. **Given** a playing slideshow, **When** the user presses Stop, **Then** the slideshow stops on the current photo and does not advance until Play is pressed again.

---

### User Story 2 - Multi-Tablet Synchronized Display (Priority: P1)

A user sets up three tablets in the living room, all joined to the same channel. All three tablets show the exact same photo at the same time and advance together. When one person presses Next on any tablet, all three tablets change to the next photo simultaneously.

**Why this priority**: Synchronized multi-tablet display is the defining feature that distinguishes this from a simple slideshow app. It is co-equal with the single-tablet story as the core experience.

**Independent Test**: Can be tested with two or more tablets (or browser tabs) joined to the same channel. Verify they stay in lock-step.

**Acceptance Scenarios**:

1. **Given** two tablets joined to the same channel, **When** one tablet presses Next, **Then** both tablets display the same new photo within 2 seconds.
2. **Given** three tablets in a playing channel, **When** the auto-advance timer fires, **Then** all three tablets advance to the next photo at the same time.
3. **Given** a channel with two tablets playing, **When** one tablet presses Stop, **Then** all tablets in the channel stop on the current photo.
4. **Given** a channel that is currently showing photo #47, **When** a new tablet joins that channel, **Then** the new tablet immediately displays photo #47 and adopts the current play/stop state.

---

### User Story 3 - Independent Channels (Priority: P2)

The family has a "living-room" channel showing vacation photos and a "kitchen" channel showing recipe inspiration photos. Each channel operates independently — different folders, different delays, different playback states. Controlling one channel never affects the other.

**Why this priority**: Channels turn a single system into a multi-room solution. This is high value but depends on the single-channel experience (P1) working first.

**Independent Test**: Can be tested by opening two browser tabs with different channel IDs and verifying that controls on one channel do not affect the other.

**Acceptance Scenarios**:

1. **Given** two channels ("living-room" and "kitchen") with different photo folders configured, **When** both are playing, **Then** each channel displays photos only from its own configured folder.
2. **Given** "living-room" is playing and "kitchen" is stopped, **When** a user presses Next on a "living-room" tablet, **Then** only "living-room" tablets advance; "kitchen" tablets remain unchanged.
3. **Given** "living-room" has a 1-minute delay and "kitchen" has a 30-second delay, **When** both are playing, **Then** each channel advances at its own configured interval independently.

---

### User Story 4 - Channel Configuration (Priority: P2)

A user opens the channel settings panel on any tablet in a channel and changes the photo folder, slideshow delay, or daily stop time. The changes apply to all tablets in that channel predictably.

**Why this priority**: Configuration makes channels useful beyond defaults. It's essential for multi-room use but not needed for the initial single-channel MVP.

**Independent Test**: Can be tested by changing a channel's settings and observing the effect on all connected tablets.

**Acceptance Scenarios**:

1. **Given** a channel configured with "Vacations" folder, **When** a user changes the folder to "Family Events" via settings, **Then** the channel begins displaying photos from "Family Events" and all tablets in the channel reflect this change.
2. **Given** a channel with a 1-minute delay, **When** a user changes the delay to 30 seconds, **Then** the next auto-advance occurs approximately 30 seconds later for all tablets.
3. **Given** a channel's photo folder is changed, **When** the change takes effect, **Then** the channel's photo ordering/sequence is regenerated for the new folder, and the channel's existing history is cleared.

---

### User Story 5 - Channel Reset (Priority: P3)

A user presses "Reset Channel" on any tablet. The channel generates a fresh random photo ordering, clears all history, and all tablets in the channel switch to the newly randomized first photo. Previous is unavailable until the next advancement creates history.

**Why this priority**: Reset provides a "start fresh" mechanism. It's a convenience feature that builds on top of the core playback.

**Independent Test**: Can be tested by pressing Reset on one tablet in a multi-tablet channel and verifying all tablets show the same new first photo with no Previous available.

**Acceptance Scenarios**:

1. **Given** a channel that has been playing for a while with accumulated history, **When** any tablet presses Reset Channel, **Then** a fresh random ordering is generated and all tablets display the new first photo.
2. **Given** a channel immediately after reset, **When** a user presses Previous, **Then** the system indicates that no previous photo is available.
3. **Given** a channel after reset, **When** the slideshow advances once, **Then** Previous becomes available and returns to the post-reset first photo.

---

### User Story 6 - Daily Automatic Stop (Priority: P3)

Each channel has a configurable daily stop time. When that time arrives (in the system's globally configured timezone), the channel automatically stops if it is playing. It stays stopped until someone manually presses Play.

**Why this priority**: A power-saving / nighttime convenience. Important for daily use but not needed for core functionality.

**Independent Test**: Can be tested by setting a channel's stop time to 1 minute in the future and verifying auto-stop occurs across all tablets.

**Acceptance Scenarios**:

1. **Given** a channel playing with daily stop time set to 23:00 in the configured timezone, **When** the clock reaches 23:00, **Then** the channel stops automatically and all tablets display the "stopped (scheduled)" state.
2. **Given** a channel that was automatically stopped at the daily stop time, **When** a user does nothing, **Then** the channel remains stopped until Play is manually pressed.
3. **Given** a channel that is already stopped before its daily stop time, **When** the stop time arrives, **Then** nothing changes — the channel remains stopped.
4. **Given** the configured timezone observes daylight saving time, **When** the daily stop time spans a DST transition, **Then** the stop triggers at the correct wall-clock time in the configured timezone.

---

### User Story 7 - Late Join and Reconnection (Priority: P2)

A tablet that was offline or was just powered on joins a channel that is already in progress. It immediately catches up to the current photo and playback state. If a tablet temporarily loses Wi-Fi, it reconnects and re-synchronizes without manual intervention.

**Why this priority**: Robustness under real-world conditions (Wi-Fi hiccups, tablet restarts) is essential for a "set it and forget it" home appliance experience.

**Independent Test**: Can be tested by disconnecting a tablet's Wi-Fi for 30 seconds, reconnecting, and verifying it re-syncs to the current channel state.

**Acceptance Scenarios**:

1. **Given** a channel is playing and showing photo #25, **When** a new tablet opens the channel URL, **Then** it immediately displays photo #25 and begins receiving future advances.
2. **Given** a tablet loses Wi-Fi for 30 seconds, **When** Wi-Fi reconnects, **Then** the tablet automatically re-synchronizes to the channel's current photo and state within 5 seconds.
3. **Given** a tablet was offline during three photo advances, **When** it reconnects, **Then** it jumps directly to the current photo (not replaying the missed transitions).
4. **Given** a tablet is reconnecting, **Then** the UI displays a "reconnecting" indicator until synchronization is complete.

---

### User Story 8 - Channel Creation and Discovery (Priority: P1)

A user navigates to the system's root URL and sees a list of all existing channels. They can tap any channel to join it directly. To create a new channel, a user navigates to a URL with a channel ID that does not yet exist — the system shows a confirmation prompt ("Channel 'living-room' does not exist. Create it?") before creating it. This prevents accidental channel creation from URL typos.

**Why this priority**: Without channel creation, no channel can exist and nothing else works. The landing page is also essential since it's the primary entry point for tablets joining existing channels.

**Independent Test**: Can be tested by visiting the root URL to see the channel list, then navigating to a new channel ID and confirming creation.

**Acceptance Scenarios**:

1. **Given** the system has channels "living-room" and "kitchen", **When** a user opens the root URL, **Then** a landing page displays both channels as selectable entries.
2. **Given** the landing page is displayed, **When** a user taps a channel name, **Then** the tablet joins that channel and begins displaying its current state.
3. **Given** a user navigates to a URL with a channel ID that does not exist (e.g., "livng-room"), **When** the page loads, **Then** the system displays a confirmation prompt asking whether to create the new channel, with an option to go back.
4. **Given** a user confirms channel creation, **Then** the new channel is created with default settings and the tablet joins it.
5. **Given** a user declines channel creation, **Then** no channel is created and the user is returned to the landing page.

---

### Edge Cases

- What happens when a channel's configured photo folder is empty or does not exist? The channel must display a clear "no photos available" message on all tablets instead of a blank screen or error.
- What happens when two users press different controls (e.g., Next and Previous) at nearly the same time? The system must process commands in arrival order — the first command received wins, and the second command operates on the resulting state.
- What happens when a photo file is corrupted or unreadable? The system must skip the unreadable photo, advance to the next one, and not stall the slideshow.
- What happens when the NAS becomes unreachable while a slideshow is playing? Tablets should continue displaying the current photo and show a connectivity warning. When the NAS returns, the slideshow resumes.
- What happens if all tablets in a channel disconnect? The channel automatically stops, preserving the current photo, configuration, and history. The next tablet to join finds the channel stopped on the last displayed photo.
- What happens when the configured daily stop time is changed while the channel is playing? If the new stop time is already in the past for today, the channel stops immediately. If it is in the future, the new stop time takes effect.
- What happens if a channel's photo folder contains non-JPEG files? The system must ignore non-JPEG files and only include valid JPEG images in the slideshow.
- What happens when a user navigates to a channel URL with a typo? The system must show a confirmation prompt naming the unrecognized channel ID, giving the user a chance to go back to the landing page instead of accidentally creating a new channel.

## Requirements *(mandatory)*

### Functional Requirements

**Global Configuration**

- **FR-G01**: The system MUST have a single, globally configurable timezone setting that applies to all channels. The default MUST be Europe/Brussels.
- **FR-G02**: The system MUST have a single, globally configurable photo output size (maximum resolution in pixels) used when serving photos to tablets. The default MUST be a sensible resolution for typical tablet screens (e.g., 1920 pixels on the longest edge).
- **FR-G03**: Global configuration changes (timezone, photo output size) MAY require a system restart to take effect.

**Photo Serving**

- **FR-001**: The system MUST serve photos from NAS-hosted JPEG libraries to tablets through a centralized network service. Tablets MUST NOT access the NAS file system directly.
- **FR-002**: The system MUST handle photo libraries of at least 10,000 JPEG files per folder without performance degradation.
- **FR-003**: The system MUST serve photos resized to the globally configured photo output size, ensuring fast loading on constrained devices.
- **FR-004**: The system MUST only serve JPEG files, ignoring any other file types present in the photo folder.

**Channels**

- **FR-005**: The system MUST support multiple independent channels operating simultaneously.
- **FR-006**: A tablet MUST join a specific channel by navigating to a URL that includes the channel ID as a path segment or query parameter.
- **FR-006a**: When a tablet navigates to a channel ID that does not yet exist, the system MUST display a confirmation prompt before creating the channel. The user MUST be able to cancel and return to the landing page.
- **FR-006b**: A channel is created implicitly upon user confirmation with default settings (default photo folder, 1-minute delay, midnight stop time).
- **FR-006c**: The system MUST provide a landing page at the root URL that lists all existing channels. Users MUST be able to select a channel from the list to join it directly.
- **FR-007**: Each channel MUST maintain its own independent playback state (playing/stopped/paused), photo sequence, current position, and navigation history.
- **FR-008**: Actions in one channel MUST NOT affect any other channel.

**Synchronization**

- **FR-009**: All tablets in the same channel MUST display the same photo at the same time.
- **FR-010**: When any tablet in a channel triggers a control action (Play, Stop, Next, Previous, Reset), the action MUST apply to all tablets in that channel.
- **FR-011**: A tablet joining a channel that is already active MUST immediately receive the current photo and playback state.
- **FR-012**: After a temporary network disconnection (up to 60 seconds), a tablet MUST automatically reconnect and re-synchronize to the channel's current state without user intervention.

**Playback Controls**

- **FR-013**: The system MUST support the following per-channel controls: Play/Start, Stop/Pause, Next, Previous, and Reset Channel.
- **FR-014**: Auto-advance MUST occur only when the channel is in "playing" state, using that channel's configured slideshow delay.
- **FR-014a**: When a user triggers Next or Previous, the auto-advance timer MUST reset and start counting from zero. The next automatic advance MUST occur one full delay interval after the manual navigation.
- **FR-015**: Previous MUST navigate to the most recently shown photo based on the channel's shared history stack.
- **FR-016**: If no history exists (e.g., after a reset or on initial start), Previous MUST be unavailable and the UI MUST indicate this clearly.

**Reset**

- **FR-017**: Reset Channel MUST regenerate the photo ordering/sequence using a fresh randomization of the channel's current photo folder.
- **FR-018**: Reset Channel MUST clear the channel's entire navigation history.
- **FR-019**: After Reset Channel, all tablets in the channel MUST display the new first photo simultaneously.

**Channel Configuration**

- **FR-020**: Each channel MUST be independently configurable with: photo folder path, slideshow delay, and daily stop time.
- **FR-021**: Channel configuration changes MUST take effect while the system is running and apply to all tablets in the channel.
- **FR-022**: The default slideshow delay MUST be 1 minute.
- **FR-023**: The default daily stop time MUST be 00:00 (midnight) in the globally configured timezone.
- **FR-024**: The default photo folder MUST be a reasonable default (e.g., an "All Photos" root folder).
- **FR-025**: When a channel's photo folder is changed, the system MUST regenerate the photo sequence for the new folder, clear the channel's history, and begin displaying from the new sequence.

**Daily Stop**

- **FR-026**: Each channel MUST automatically stop at its configured daily stop time (in the globally configured timezone) if currently playing.
- **FR-027**: After an automatic daily stop, the channel MUST remain stopped until a user manually presses Play.
- **FR-028**: The daily stop MUST handle daylight saving time transitions correctly for the configured timezone.

**Tablet UI**

- **FR-029**: The tablet UI MUST display photos fullscreen, suitable for kiosk/always-on use.
- **FR-030**: The UI MUST provide visible, accessible controls for: Play/Start, Stop/Pause, Next, Previous, Reset Channel, and Channel Settings.
- **FR-030a**: When controls are visible, the UI MUST also display the current photo's file name and date taken (extracted from EXIF metadata). If date taken is unavailable, the file's last modified date MUST be shown instead.
- **FR-031**: The UI MUST support optional swipe gestures for Next (swipe left) and Previous (swipe right).
- **FR-032**: The UI MUST clearly indicate the current state: playing, stopped (manual), stopped (scheduled), syncing/reconnecting, or offline.
- **FR-033**: The UI MUST display the current channel ID, the selected photo folder name, and the active configuration (delay and stop time).
- **FR-034**: The UI MUST be usable on older Android tablets and phones with limited memory and processing power.

**Channel State Persistence**

- **FR-035**: Channel state (current photo, configuration, history) MUST persist if all tablets disconnect, so that the next tablet to join resumes seamlessly.
- **FR-035a**: When all tablets disconnect from a playing channel, the channel MUST automatically stop. When the next tablet joins, the channel MUST be in stopped state on the last displayed photo.

### Key Entities

- **Global Configuration**: System-wide settings that apply to all channels — timezone (IANA timezone identifier, e.g., "Europe/Brussels") and photo output size (maximum resolution in pixels for served photos).
- **Channel**: An independent synchronized group identified by a unique channel ID. Holds its own configuration, playback state, photo sequence, current position, and navigation history.
- **Photo**: A single JPEG image from the NAS library, identified by its path relative to the channel's configured photo folder. Attributes: file path, file name, file size, date taken (from EXIF metadata), last modified date.
- **Photo Sequence**: An ordered list of photos for a channel, generated by randomizing all photos in the channel's configured folder. Regenerated on Reset or folder change.
- **Navigation History**: A stack of previously displayed photos for a channel, enabling the Previous control. Cleared on Reset or folder change.
- **Channel Configuration**: The per-channel settings — photo folder path, slideshow delay (duration), and daily stop time (time of day in the globally configured timezone).
- **Playback State**: The current state of a channel — one of: playing, stopped (manual), stopped (scheduled), or stopped (no clients). Determines whether auto-advance is active.

## Assumptions

- The NAS is always available on the local network during normal operation; brief outages are tolerated gracefully.
- Photo folders on the NAS are organized in a directory structure where each subfolder can serve as a logical album.
- All photos are standard JPEG files (`.jpg` / `.jpeg`); no RAW, HEIC, or other formats need to be supported.
- Devices (tablets, phones, or any device with a modern browser) run a browser that supports fullscreen web apps and real-time communication (WebSocket or equivalent).
- The k3s cluster and/or NAS Docker environment provide sufficient compute to serve resized photos and manage channel state for up to ~10 concurrent devices.
- The local network provides sufficient bandwidth for serving resized photos to multiple tablets simultaneously (~50–200 KB per photo at display resolution).
- The system timezone is a single global setting (default: Europe/Brussels) that applies to all channels. Per-channel timezone overrides are not required.
- Photo metadata (EXIF orientation) should be respected to display photos in correct orientation.
- The system does not need to support video files — only still JPEG images.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can set up a new photo frame tablet in under 2 minutes (power on tablet, open browser, enter URL — no app install required).
- **SC-002**: All tablets in a channel display the same photo within 2 seconds of any control action or auto-advance event.
- **SC-003**: The system handles photo libraries of at least 10,000 JPEGs per folder without noticeable UI lag or loading delays on tablets.
- **SC-004**: After a Wi-Fi interruption of up to 60 seconds, a tablet re-synchronizes to the channel's current state within 5 seconds of reconnection.
- **SC-005**: The daily automatic stop triggers within 5 seconds of the configured stop time, including across daylight saving time transitions.
- **SC-006**: Channel configuration changes (folder, delay, stop time) take effect for all tablets in the channel within 5 seconds of being saved.
- **SC-007**: The system supports at least 5 independent channels operating simultaneously without cross-channel interference.
- **SC-008**: The system operates reliably as an unattended home appliance, running continuously for weeks without requiring manual restarts or maintenance.
- **SC-009**: Photos display in correct orientation (respecting EXIF data) and fill the tablet screen appropriately on both landscape and portrait orientations.
- **SC-010**: Late-joining tablets display the current channel photo and state within 3 seconds of loading the page.
