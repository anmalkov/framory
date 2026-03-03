# Usage Guide

Framory turns any device with a web browser into a synchronized digital photo
frame. This guide shows you how to create channels, connect your devices, and
control what photos are displayed — no technical knowledge required.

## Creating a Channel

A **channel** is a named slideshow. Each channel has its own set of photos,
timing, and controls.

1. Open Framory in your browser (ask the person who set it up for the address —
   it looks like `http://framory.local:8000` or similar)
2. You will see the home screen. If no channels exist yet, the page will tell
   you to create one
3. To create a channel, add `?channel=` followed by a name to the address. For
   example: `http://framory.local:8000/?channel=living-room`
4. Channel names must be lowercase letters, numbers, and hyphens (e.g.,
   `family`, `vacation-2025`, `kitchen-frame`)
5. Once created, the channel appears on the home screen for easy access

## Connecting a Device

Once a channel exists, you can open it on any device — a tablet on the wall, a
phone on the nightstand, or a laptop on the desk.

1. Open your browser and go to the Framory address with your channel name
   (e.g., `http://framory.local:8000/?channel=living-room`)
2. The device will connect to the channel and start showing photos
3. To use the full screen, tap anywhere on the photo to reveal the control bar,
   then tap the fullscreen button
4. For a wall-mounted tablet, enable fullscreen and leave the device — it will
   keep showing photos automatically

## Controlling Playback

When the slideshow is running, you can control it from any connected device.

### Using the on-screen controls

1. **Tap anywhere** on the photo to show the control bar
2. While the slideshow is playing, a thin progress line at the bottom of the
   screen shows how long until the next photo (this can be turned off in
   settings)
3. The controls appear at the bottom of the screen:
   - **▶ Play** — Start the slideshow
   - **⏹ Stop** — Pause the slideshow on the current photo
   - **⏭ Next** — Skip to the next photo
   - **⏮ Previous** — Go back to the last photo you saw
   - **↺ Reset** — Reshuffle the photos and start from the beginning
   - **⚙ Settings** — Open the settings panel (see below)
3. Tap anywhere on the photo again to hide the controls

### Using swipe gestures

- **Swipe left** on the photo to go to the next photo
- **Swipe right** to go back to the previous photo

### What the controls do to other devices

Any change you make on one device is immediately reflected on all other devices
viewing the same channel. If you tap "Next" on your phone, every tablet
connected to that channel will also jump to the next photo.

## Settings

To change how a channel behaves, open the settings panel:

1. Tap the photo to show the control bar
2. Tap the **⚙ Settings** button
3. You can change the following:

### Photo Folder

Choose which folder of photos to display. Tap **Browse** to see the available
folders and how many photos each one contains. Select a folder and tap **Save**.

### Delay Between Photos

Set how many seconds each photo stays on screen before the slideshow moves to
the next one. The minimum is 5 seconds. A longer delay (e.g., 60 or 120
seconds) works well for a wall-mounted frame.

### Show Progress Bar

Toggle whether a thin progress line appears at the bottom of the screen. When
enabled, the line grows from left to right over the delay period, showing how
long until the next photo. Turning it off gives a cleaner look for wall-mounted
frames.

### Daily Stop Time

Set a time when the slideshow automatically stops each day. For example, set it
to `23:00` so the frame goes dark at 11 PM. Set it to `00:00` to disable the
automatic stop.

After making changes, tap **Save** to apply them. The new settings take effect
immediately on all connected devices.

## Multi-Device Sync

Framory is designed for multiple screens showing the same photos at the same
time:

- **Same photo, everywhere** — Every device on the same channel always displays
  the same photo. When the slideshow advances, all screens update together.
- **Control from anywhere** — Pick up any device to play, pause, skip, or
  change settings. All other devices follow along instantly.
- **Automatic pause** — If all devices disconnect from a channel (e.g.,
  everyone closes their browser), the slideshow pauses. It resumes when someone
  reconnects.
- **Automatic reconnection** — If a device briefly loses its connection (e.g.,
  Wi-Fi hiccup), it reconnects automatically and catches up to the current
  photo.

That's all you need to know to use Framory. Enjoy your photos!
