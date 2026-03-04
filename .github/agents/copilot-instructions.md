# framory Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-02

## Active Technologies
- Python 3.14+ (backend), TypeScript (frontend) (001-channel-photo-frame)
- SQLite via aiosqlite (PVC-backed in k3s) (001-channel-photo-frame)
- Markdown (GitHub Flavored Markdown with Mermaid diagram support) + markdownlint-cli2 (npm, for markdown linting), markdownlint-cli2-action (GitHub Action v22) (002-project-documentation)
- N/A (documentation files only) (002-project-documentation)
- GitHub Actions workflow (YAML), no application code changes + GitHub Actions (`actions/checkout@v4`, `docker/login-action@v3`, `docker/metadata-action@v5`, `docker/build-push-action@v6`, `softprops/action-gh-release@v2`) (004-tag-release-pipeline)
- N/A — no database or file storage changes (004-tag-release-pipeline)
- Python 3.12+ (backend), TypeScript 5.7 (frontend) (005-add-channel-ui)

- Python 3.14+ (backend), TypeScript 5.x (frontend) + FastAPI, Uvicorn, Pillow, aiosqlite, Pydantic Settings (backend); React 18+, Vite, Tailwind CSS, react-swipeable (frontend) (001-channel-photo-frame)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

Python 3.14+ (backend), TypeScript 5.x (frontend): Follow standard conventions

## Recent Changes
- 005-add-channel-ui: Added Python 3.12+ (backend), TypeScript 5.7 (frontend)
- 004-tag-release-pipeline: Added GitHub Actions workflow (YAML), no application code changes + GitHub Actions (`actions/checkout@v4`, `docker/login-action@v3`, `docker/metadata-action@v5`, `docker/build-push-action@v6`, `softprops/action-gh-release@v2`)
- 003-photo-progress-bar: Added Python 3.14+ (backend), TypeScript (frontend)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
