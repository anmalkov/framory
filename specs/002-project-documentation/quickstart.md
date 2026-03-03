# Quickstart: Project Documentation

**Feature**: 002-project-documentation

## What This Feature Delivers

Six new files added to the repository:

| File | Purpose |
|------|---------|
| `README.md` | Open-source project landing page |
| `docs/usage.md` | Non-technical user manual |
| `docs/development.md` | Developer onboarding guide |
| `docs/architecture.md` | Architecture diagrams and explanations |
| `.markdownlint.json` | Markdown lint rule configuration |
| `.github/workflows/docs-lint.yml` | CI check for documentation formatting |

Plus one supporting file: `LICENSE` (MIT) at repo root.

## Implementation Order

```text
1. .markdownlint.json          ← Lint config first (enables editor feedback while writing)
2. README.md                   ← P1: front door of the project
3. docs/development.md         ← P1: developer onboarding
4. docs/usage.md               ← P2: user manual
5. docs/architecture.md        ← P2: architecture understanding
6. LICENSE                     ← Referenced by README
7. .github/workflows/docs-lint.yml  ← P3: CI quality gate (validates all docs written above)
```

## Key Tools

- **Lint locally**: `npx markdownlint-cli2 "README.md" "docs/*.md"`
- **Auto-fix**: `npx markdownlint-cli2 --fix "README.md" "docs/*.md"`
- **Editor**: Install `DavidAnson.vscode-markdownlint` VS Code extension for real-time feedback

## Configuration Summary

**.markdownlint.json** (repo root):

```json
{
  "MD013": false,
  "MD033": false,
  "MD024": { "siblings_only": true }
}
```

**docs-lint.yml** triggers:

- `push` to `main` — paths: `docs/**`, `README.md`, `.markdownlint.json`
- `pull_request` — same paths
- Uses: `DavidAnson/markdownlint-cli2-action@v22`
- Globs: `README.md docs/*.md`

## Content Sources

When writing documentation, extract information from these existing files:

| Information | Source |
|-------------|--------|
| Backend dependencies & versions | `backend/pyproject.toml` |
| Frontend dependencies & versions | `frontend/package.json` |
| API routes | `backend/app/api/routes.py` |
| WebSocket protocol | `backend/app/api/websocket.py` |
| Data model (Channel) | `backend/app/models/channel.py` |
| Photo serving logic | `backend/app/services/photo_service.py` |
| Channel management | `backend/app/services/channel_manager.py` |
| Scheduler logic | `backend/app/services/scheduler.py` |
| Config values & defaults | `backend/app/config.py` |
| Database schema | `backend/app/db/schema.sql` |
| Dockerfile (build stages) | `Dockerfile` |
| K8s deployment | `k8s/deployment.yaml`, `k8s/configmap.yaml` |
| Frontend components | `frontend/src/components/` |
| Frontend pages | `frontend/src/pages/` |
| Vite proxy config | `frontend/vite.config.ts` |
| Tailwind config | `frontend/tailwind.config.ts` |
| Test setup | `backend/tests/conftest.py`, `frontend/tests/` |
