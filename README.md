# Framory - Self-Hosted Synchronized Digital Photo Frame (Web-Based)

**Turn any browser into a synchronized digital photo frame.**  
Framory is a **self-hosted digital photo frame** you can run with **Docker** to display your photos on **any device with a web browser** — tablets, phones, TVs, Raspberry Pi kiosks, or wall-mounted screens. Connect multiple devices to the same **channel** and they stay perfectly in sync: change the photo on one screen and every other screen updates instantly via **WebSockets**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-3776AB.svg)](https://www.python.org/)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933.svg)](https://nodejs.org/)

---

## What is Framory?

Framory is a **browser-based photo frame server** for private, self-hosted slideshows. It’s built for **multi-device sync**, **kiosk mode**, and **channel-based displays** — so multiple screens can show the same photo at the same time, controlled from any device.

---

## Visual Preview

<!-- Add a screenshot or GIF for higher conversion.
     Example:
     ![Framory synchronized photo frame screenshot](docs/assets/screenshot.png)
-->

*Screenshot coming soon — see the [Usage Guide](docs/usage.md) for a walkthrough.*

---

## Features

- **Synchronized multi-device photo frame** — All connected screens show the same photo at the same time, controlled from any device
- **Channel-based displays** — Create named channels with their own photo folder, timing, and schedule
- **NAS / network storage friendly** — Serve photos from shared storage (including NFS-mounted folders)
- **Kiosk-friendly fullscreen UI** — Tap-to-reveal controls designed for wall-mounted tablets and always-on displays
- **Real-time WebSocket sync** — Instant updates across all clients with automatic reconnection
- **Configurable slideshow scheduling** — Set a delay between photos (5 s+) and an optional daily stop time so the frame turns off on schedule

---

## Use Cases

### 🖼️ Wall-mounted tablet photo frame

Mount an old iPad/Android tablet and run Framory in fullscreen for a clean, kiosk-style photo frame.

### 📺 TV + Raspberry Pi “living room frame”

Open Framory on a Raspberry Pi connected to a TV to rotate family photos on a large screen.

### 🏠 Multi-room synchronized displays

Keep a kitchen tablet and hallway display showing the same photo — skip ahead on one, and both update instantly.

### 🧑‍💼 Office / studio slideshow

Show a rotating set of images (events, product shots, portfolio) on multiple screens with centralized control.

### 🗂️ NAS-backed photo library

Point channels to folders on your NAS (mounted locally or via NFS) so you don’t duplicate photo storage.

### 🎉 Event display

Run a dedicated channel for a party/wedding/baby photos and control the slideshow from any phone.

---

## Quick Start (Docker)

Run Framory with Docker:

```bash
docker run -d \
  -p 8000:8000 \
  -v /path/to/your/photos:/photos:ro \
  -v framory-data:/data \
  anmalkov/framory
```

Open in your browser:

- `http://localhost:8000`

> Tip: Point `/path/to/your/photos` at a local folder, a NAS mount, or an NFS-mounted directory.

For a full development setup, see the [Development Guide](docs/development.md).

---

## How It Works

1. **Create a channel** (e.g., `living-room`, `kitchen`, `office`)
2. **Map a photo folder** to that channel
3. **Open the channel URL** on any number of devices
4. Control playback from any device — every connected screen stays synced

---

## Documentation

- **[Usage Guide](docs/usage.md)** — How to create channels, connect devices,
  and control playback (no technical background needed)
- **[Development Guide](docs/development.md)** — Local setup, running, testing,
  debugging, and Docker builds
- **[Architecture](docs/architecture.md)** — System design, sequence diagrams,
  data model, and deployment topology

---

## Contributing

Contributions are welcome! To get started:

1. Read the [Development Guide](docs/development.md) for environment setup
2. Create a feature branch from `main` (e.g., `feature/my-change`)
3. Make your changes with tests where appropriate
4. Ensure all checks pass: `ruff check`, `mypy --strict`, `pytest`, `npm run lint`, `npm run test`
5. Open a pull request describing what you changed and why

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file
for details.
