# Research: Photo Transition Progress Bar

**Feature**: 003-photo-progress-bar  
**Date**: 2026-03-03

## Research Task 1: CSS Animation Approach for Smooth Progress Line

**Question**: What is the best way to animate a thin progress line from 0% to 100% width over N seconds on low-power Android tablets?

### Decision: CSS `transition` on `width` with `linear` timing

### Rationale

Three approaches were evaluated:

1. **CSS `transition` on `width`** — Set `width: 0%`, then immediately set `width: 100%` with `transition: width Ns linear`. The browser handles the interpolation on the compositor thread. GPU-accelerated on modern browsers. Zero JS overhead during animation.

2. **CSS `@keyframes` animation** — Define a `@keyframes` from `width: 0%` to `width: 100%` and apply it with `animation: progress Ns linear`. Functionally equivalent to option 1 but slightly harder to dynamically control (pause/resume requires `animation-play-state` and careful state management).

3. **JS `requestAnimationFrame` loop** — Manually interpolate width each frame based on elapsed time. Maximum control but runs on the main thread, competing with React renders. On low-power tablets, this can cause dropped frames and jank.

**Choice**: Option 1 (CSS `transition` on `width`). Simplest, zero main-thread cost, and trivially controllable:
- **Start**: Set `width: 100%` with `transition-duration: Ns`
- **Reset**: Remove transition (`transition: none`), set `width: 0%`, force reflow, re-add transition, set `width: 100%`
- **Pause**: Capture `getComputedStyle(el).width`, set it as explicit width with `transition: none`
- **Resume**: Re-apply `width: 100%` with adjusted `transition-duration` for remaining time

The `transform: scaleX()` approach was also considered (transforms are always GPU-composited), but `scaleX` scales from center by default, requiring `transform-origin: left`, and is less intuitive for a left-to-right progress bar. The visual result is identical since `width` transitions on a simple `div` are also GPU-composited in modern browsers.

### Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| CSS transition (width) | Zero JS cost, simple, GPU-composited | Pause/resume needs computed style capture |
| CSS @keyframes | Declarative, GPU-composited | Harder to dynamically control duration, pause/resume more complex |
| JS requestAnimationFrame | Full control | Main-thread cost, jank risk on tablets |
| CSS transition (scaleX) | Always GPU-composited | transform-origin needed, less semantic, same result |

## Research Task 2: Visual Design — Color, Height, and Positioning

**Question**: What color, height, and position provide the right balance of subtlety and visibility for a progress line overlaying photos?

### Decision: 2px tall, `rgba(255, 255, 255, 0.4)`, fixed to absolute bottom of viewport

### Rationale

- **Height**: 2px is the sweet spot. 1px disappears on lower-DPI tablets. 3px starts becoming noticeable. 2px is perceivable when you look for it but invisible in peripheral vision.
- **Color**: Semi-transparent white (`rgba(255, 255, 255, 0.4)`) works against both dark and light photos. Against dark backgrounds, it's clearly visible. Against light backgrounds, it's still perceivable as a subtle lighter band. Alternative: semi-transparent primary color (`--color-primary` at 40% opacity), but white is more neutral and less distracting.
- **Position**: Absolute bottom of the viewport (`bottom: 0, left: 0`), overlaying whatever is beneath. This is where YouTube and many video players place their progress bars — a well-understood UI pattern. Positioned with `position: fixed` and `z-index` above the photo but below control overlays.
- **No background track**: Unlike a full progress bar, we do NOT render the unfilled portion. Only the filled line is visible. This makes it even more minimal — just a glowing edge at the bottom that grows.

### Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| Below the photo (separate layout space) | Shifts photo layout, wastes screen space, violates FR-013 |
| Top of screen | Less conventional, conflicts with offline/status indicators |
| Colored line matching `--color-primary` | More visually distracting than neutral white |
| 1px height | Invisible on many tablets |
| 3px+ height | Too prominent, distracts from photo |
| Full track (background + fill) | Too heavy for "tiny line" requirement |

## Research Task 3: React Implementation Pattern for CSS Transition Control

**Question**: How to correctly trigger CSS transition reset from React when `seq` (photo sequence counter) changes?

### Decision: Use `key` prop on the progress bar element, keyed to `seq`

### Rationale

When `seq` changes (new photo), React unmounts the old element and mounts a new one. The new element starts with `width: 0%` and the CSS transition takes it to `width: 100%`. This is the cleanest React pattern — no refs, no `getComputedStyle`, no forced reflows.

For pause/resume (FR-004, FR-005), the component uses a `paused` prop. When paused, the component:
1. Reads current computed width via a ref
2. Freezes at that width with `transition: none`
3. On resume, re-applies `width: 100%` with adjusted duration for remaining proportion

However, a simpler approach is preferred for pause: Since the progress bar is not visible when playback is stopped (FR-011), and the line resets on resume anyway (the timer restarts), we can simply hide the bar when not playing. This avoids the complexity of pause/resume animation state entirely.

**Simplified behavior**:
- Playing: Show bar, animate from 0% to 100% over `delay_seconds`
- Not playing: Hide bar (or show at 0%)
- Photo changes (seq changes): Key-based remount resets animation automatically

### Alternatives Considered

| Pattern | Pros | Cons |
|---------|------|------|
| `key={seq}` remount | Cleanest, no refs, automatic reset | Remounts DOM element (trivial cost for a single div) |
| useEffect + ref + forceReflow | No remount | Complex, error-prone, needs getComputedStyle |
| CSS @keyframes with `animationName` toggle | Declarative | Harder to sync duration dynamically |

## Research Task 4: SQLite Schema Migration for `show_progress_bar`

**Question**: How to add the `show_progress_bar` column to the existing `channels` table?

### Decision: Add `ALTER TABLE` migration with `DEFAULT 1` (true), plus update `schema.sql` for new installs

### Rationale

The existing pattern in this project uses a single `schema.sql` with `CREATE TABLE IF NOT EXISTS`. For adding a column to an existing table:

1. Update `schema.sql` to include `show_progress_bar INTEGER NOT NULL DEFAULT 1` in the `CREATE TABLE` statement (for fresh installs).
2. Add an `ALTER TABLE` migration. SQLite doesn't have `ADD COLUMN IF NOT EXISTS`, but we can use a try/catch pattern: attempt the `ALTER TABLE` and silently catch the "duplicate column" error. The `db.py` `init_db()` function runs schema at startup — add the migration there.

The default value `1` (SQLite integer for true) means existing channels will show the progress bar, matching the spec default.

### Alternatives Considered

| Approach | Rejected Because |
|----------|------------------|
| Migration numbering system | Over-engineering for a single-dev project with one table |
| Recreate table | Destructive, loses data, unnecessary |
| Store in separate table | Violates Simplicity — it's one boolean on an existing entity |
