# Framory

**Turn any browser into a synchronized digital photo frame.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-3776AB.svg)](https://www.python.org/)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933.svg)](https://nodejs.org/)

Framory is a self-hosted digital photo frame system that displays your photos
on any device with a browser. Connect multiple tablets, phones, or screens to
the same channel and they all stay perfectly in sync — change the photo on one
device and every other device follows instantly.

## Visual Preview

<!-- TODO: Add a screenshot or GIF of Framory in action.
     Place the image in the repo (e.g., docs/assets/screenshot.png) and update
     the path below:
     ![Framory screenshot](docs/assets/screenshot.png)
-->

*Screenshot coming soon — see the [Usage Guide](docs/usage.md) for a walkthrough.*

## Features

- **Multi-device sync** — All connected screens show the same photo at the same
  time, controlled from any device
- **Channel-based display** — Create named channels, each with their own photo
  folder, timing, and schedule
- **NAS integration** — Serve photos directly from your network-attached storage
  over NFS
- **Kiosk-friendly UI** — Fullscreen mode with tap-to-reveal controls, designed
  for wall-mounted tablets
- **WebSocket real-time sync** — Instant state updates across all connected
  clients with automatic reconnection
- **Configurable slideshow** — Set delay between photos (5 s+) and a daily stop
  time so the frame turns off on schedule

## Quick Start

Run Framory with Docker:

```bash
docker run -d \
  -p 8000:8000 \
  -v /path/to/your/photos:/photos:ro \
  -v framory-data:/data \
  anmalkov/framory
```

Then open `http://localhost:8000` in your browser.

For a full development setup, see the [Development Guide](docs/development.md).

## Documentation

- **[Usage Guide](docs/usage.md)** — How to create channels, connect devices,
  and control playback (no technical background needed)
- **[Development Guide](docs/development.md)** — Local setup, running, testing,
  debugging, and Docker builds
- **[Architecture](docs/architecture.md)** — System design, sequence diagrams,
  data model, and deployment topology

## Contributing

Contributions are welcome! To get started:

1. Read the [Development Guide](docs/development.md) for environment setup
2. Create a feature branch from `main` (e.g., `feature/my-change`)
3. Make your changes with tests where appropriate
4. Ensure all checks pass: `ruff check`, `mypy --strict`, `pytest`, `npm run lint`, `npm run test`
5. Open a pull request describing what you changed and why

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file
for details.
