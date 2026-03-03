# framory Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-02

## Active Technologies
- Python 3.14+ (backend), TypeScript (frontend) (001-channel-photo-frame)
- SQLite via aiosqlite (PVC-backed in k3s) (001-channel-photo-frame)
- Markdown (GitHub Flavored Markdown with Mermaid diagram support) + markdownlint-cli2 (npm, for markdown linting), markdownlint-cli2-action (GitHub Action v22) (002-project-documentation)
- N/A (documentation files only) (002-project-documentation)

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
- 002-project-documentation: Added Markdown (GitHub Flavored Markdown with Mermaid diagram support) + markdownlint-cli2 (npm, for markdown linting), markdownlint-cli2-action (GitHub Action v22)
- 001-channel-photo-frame: Added Python 3.14+ (backend), TypeScript (frontend)

- 001-channel-photo-frame: Added Python 3.14+ (backend), TypeScript 5.x (frontend) + FastAPI, Uvicorn, Pillow, aiosqlite, Pydantic Settings (backend); React 18+, Vite, Tailwind CSS, react-swipeable (frontend)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
