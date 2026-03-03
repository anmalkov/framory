# Feature Specification: Photo Transition Progress Bar

**Feature Branch**: `003-photo-progress-bar`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "I want to have a tiny line under the photo in UI that will play a role of the indicator when the next photo appears — like a progress bar — but a tiny line. When the timer goes, the line grows from left to right. When the line is full, the next photo appears and the line starts showing progress again. Add a setting in a channel — show progress bar or not. The line should not be visually distracting from the photo but at the same time visible. Best place for the line — at the bottom of the screen."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Watch Photos with Visible Timer Progress (Priority: P1)

A user opens a channel and watches photos cycle automatically. At the very bottom edge of the screen, a thin horizontal line steadily grows from left to right, showing how much time remains before the next photo appears. When the line reaches the full width of the screen, the next photo loads and the line resets to zero and begins growing again. The line is subtle enough not to distract from the photo, yet visible enough that the user can glance at it to gauge timing.

**Why this priority**: This is the core feature — without the animated progress line, the entire specification has no value. It directly addresses the user's primary request.

**Independent Test**: Can be fully tested by opening any channel with playback running and observing the line animate across the bottom of the screen in sync with the photo timer.

**Acceptance Scenarios**:

1. **Given** a channel is playing with a delay of N seconds, **When** a new photo appears, **Then** a thin line at the bottom of the screen starts at zero width and grows linearly to full width over the next N seconds.
2. **Given** the progress line has reached full width, **When** the next photo loads, **Then** the line resets to zero and begins growing again immediately.
3. **Given** playback is stopped (manually, by schedule, or by all clients disconnecting), **When** the user looks at the bottom of the screen, **Then** the progress line is not visible.
4. **Given** playback was stopped and is resumed, **When** the next photo cycle begins, **Then** the progress line resets to zero and starts a fresh animation.
5. **Given** the user manually advances to the next photo (swipe or button), **When** the next photo appears, **Then** the progress line resets to zero and begins a fresh cycle.

---

### User Story 2 — Toggle Progress Bar Visibility in Settings (Priority: P2)

A user opens the channel settings panel and finds a toggle to show or hide the progress bar. By default, the progress bar is visible. When the user turns it off, the progress line disappears immediately. The preference is remembered per channel so it persists across sessions and page reloads.

**Why this priority**: Gives users control over the feature. Some users may prefer a completely clean photo display. Without this, users who find the line distracting have no recourse.

**Independent Test**: Can be fully tested by toggling the setting in the settings panel and observing that the progress line appears or disappears accordingly, and that the choice is remembered after refreshing the page.

**Acceptance Scenarios**:

1. **Given** the settings panel is open, **When** the user views channel settings, **Then** a "Show progress bar" toggle is visible with its current state.
2. **Given** the progress bar is enabled (default), **When** the user disables it, **Then** the progress line disappears from the screen immediately.
3. **Given** the progress bar is disabled, **When** the user enables it, **Then** the progress line appears and begins a new animation cycle from zero.
4. **Given** the user has changed the progress bar setting, **When** the user closes and reopens the channel (or refreshes the page), **Then** the previously chosen setting is still in effect.

---

### Edge Cases

- What happens when the delay changes while the progress line is mid-animation? The line resets and starts a new cycle with the updated delay duration.
- What happens when the channel has no photos? The progress line is not rendered (there is nothing to count down to).
- What happens when playback is stopped due to a schedule (stop_time)? The progress line disappears, same as manual stop.
- What happens when the connection is lost (offline/reconnecting)? The progress line completes its current animation cycle and remains at 100% until reconnection delivers a new state, which resets the animation.
- What happens when the browser window is resized? The progress line always spans the full viewport width, adapting fluidly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a thin horizontal progress line fixed to the bottom edge of the viewport, spanning the full screen width.
- **FR-002**: The progress line MUST animate linearly from 0% to 100% width over the configured delay period (delay_seconds) for the current channel.
- **FR-003**: When a new photo loads, the progress line MUST reset to 0% width and begin a new animation cycle.
- **FR-004**: When playback is stopped (manually, by schedule, or by all clients disconnecting), the progress line MUST be hidden — consistent with FR-011.
- **FR-005**: When playback resumes after being stopped, the progress line MUST reset to 0% and begin a new animation cycle.
- **FR-006**: When the user manually navigates to the next or previous photo, the progress line MUST reset to 0% and begin a new cycle.
- **FR-007**: The channel data model MUST include a boolean setting to control progress bar visibility, defaulting to visible (true).
- **FR-008**: The settings panel MUST include a toggle for the "Show progress bar" setting.
- **FR-009**: Changes to the progress bar visibility MUST take effect immediately without requiring a page reload.
- **FR-010**: The progress bar visibility setting MUST be persisted per channel on the server so it survives page reloads and shared across devices viewing the same channel.
- **FR-011**: The progress line MUST NOT be rendered when there are no photos in the channel or when playback is stopped.
- **FR-012**: The progress line MUST be visually subtle — semi-transparent, thin (2–3 pixels tall), and use a design-token-based color that does not compete with the photo content.
- **FR-013**: The progress line MUST be rendered on top of the photo (overlaying the bottom edge), not below it, so it does not shift the photo layout.

### Key Entities

- **Channel** (extended): Adds a `show_progress_bar` boolean attribute. Controls whether the progress line is displayed for this channel. Default: true. Persisted alongside other channel settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see the progress line grow smoothly from left to right in sync with the photo timer, with no visible stutter or jumping.
- **SC-002**: The progress bar setting toggle in the settings panel shows/hides the progress line within 1 second of interaction.
- **SC-003**: The progress bar visibility preference survives page reloads — the user does not need to re-enable it each session.
- **SC-004**: The progress line is perceivable when the user glances at the bottom of the screen, but does not draw attention away from the photo in casual viewing (subjective — validated by having the line be ≤ 3px tall and semi-transparent).
- **SC-005**: When playback stops or the channel has no photos, the progress line is not visible — zero false-positive animations.

## Assumptions

- The photo transition timer is driven by the existing `delay_seconds` channel setting, and the progress line uses this same value as its animation duration.
- The animation runs purely on the client side using the configured delay; no separate server-side "time remaining" endpoint is needed. The client starts a fresh timer when it receives a new photo via WebSocket.
- Default progress bar visibility is **enabled** (true) — most users will want to see it.
- The progress line height of 2–3px and semi-transparent white color will provide the right balance of subtlety and visibility against typical photo backgrounds. The exact visual tuning can be refined during implementation.
- The progress line is positioned at the absolute bottom of the viewport, overlaying the photo, not occupying separate layout space.
