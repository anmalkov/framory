# Data Model: Project Documentation

**Feature**: 002-project-documentation

## Overview

This is a documentation-only feature — no application data models are created or modified. This file documents the **information architecture** of the documentation deliverables: what content entities exist, their relationships, and the validation rules enforced by the lint pipeline.

## Documentation Entities

### E1: README.md

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title + tagline | Heading + text | Yes | Project name and one-line description |
| Badges | Inline images | Yes | License, build status, tech stack |
| Visual preview | Image/placeholder | Yes | Screenshot or GIF of running app |
| Features | Bullet list | Yes | Key capabilities |
| Quick Start | Code block + steps | Yes | Minimal Docker run command |
| Documentation links | Markdown links | Yes | Links to usage.md, development.md, architecture.md |
| Contributing | Text + links | Yes | Guidelines, link to dev guide |
| License | Text + link | Yes | License type + link to LICENSE file |

**Relationships**: Links to → docs/usage.md, docs/development.md, docs/architecture.md, LICENSE

### E2: docs/usage.md

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Introduction | Text | Yes | What Framory does, scope of guide |
| Creating a Channel | Steps | Yes | Navigate to landing page, enter name |
| Connecting a Device | Steps | Yes | Open channel URL, fullscreen |
| Controlling Playback | Steps + descriptions | Yes | Play, stop, next, prev, swipe gestures |
| Settings | Steps | Yes | Photo folder, delay, daily stop time |
| Multi-Device Sync | Explanation | Yes | How sync works from user perspective |

**Relationships**: Referenced by ← README.md

### E3: docs/development.md

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Prerequisites | List with versions | Yes | Python, Node.js, Docker versions |
| Backend Setup | Steps + code blocks | Yes | venv, pip install, config |
| Frontend Setup | Steps + code blocks | Yes | npm install, env vars |
| Running Locally | Steps + code blocks | Yes | Backend + frontend start commands |
| Testing | Commands + descriptions | Yes | pytest, vitest, ruff, mypy, eslint |
| Debugging | Guidance | Yes | Uvicorn reload, browser devtools, Vite HMR |
| Docker Build | Steps + code blocks | Yes | docker build, docker run |
| Project Structure | Tree + descriptions | Yes | Directory layout explanation |
| Code Style & Conventions | Rules + tool refs | Yes | Linter/formatter configuration |

**Relationships**: Referenced by ← README.md

### E4: docs/architecture.md

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| High-level diagram | Mermaid graph | Yes | All major components |
| Component explanations | Text per component | Yes | REST API, WebSocket, ChannelManager, PhotoService, Scheduler, DB |
| Connection/sync sequence | Mermaid sequenceDiagram | Yes | WebSocket connect → state broadcast |
| Photo advance sequence | Mermaid sequenceDiagram | Yes | Timer → next photo → broadcast |
| Playback command sequence | Mermaid sequenceDiagram | Yes | User action → command → broadcast |
| Data Model section | Text + description | Yes | Channel entity, states, photo metadata |
| Architectural Decisions | Table or list | Yes | Key choices + rationale |
| Deployment Architecture | Mermaid diagram + text | Yes | k8s topology, NFS, PVC |

**Relationships**: Referenced by ← README.md

### E5: .markdownlint.json

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| MD013 | boolean | Yes | `false` — disable line length |
| MD033 | boolean | Yes | `false` — allow inline HTML |
| MD024 | object | Yes | `{ "siblings_only": true }` — allow duplicate headings across sections |

**Relationships**: Consumed by → docs-lint.yml, vscode-markdownlint extension

### E6: .github/workflows/docs-lint.yml

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Trigger: push | paths filter | Yes | main branch, docs/** + README.md |
| Trigger: pull_request | paths filter | Yes | docs/** + README.md + .markdownlint.json |
| Action | markdownlint-cli2-action@v22 | Yes | Globs: README.md docs/*.md |

**Relationships**: Uses → .markdownlint.json; validates → README.md, docs/*.md

## State Transitions

N/A — documentation files are static content with no runtime state.

## Validation Rules

All markdown files are validated by markdownlint-cli2 using the rules configured in `.markdownlint.json`. Key enforced rules:

- **MD001**: Heading levels increment by one
- **MD003**: Heading style consistency (atx)
- **MD009**: No trailing spaces (use `<br>` for line breaks)
- **MD010**: No hard tabs
- **MD012**: No multiple consecutive blank lines
- **MD022**: Headings surrounded by blank lines
- **MD025**: Single top-level heading per file
- **MD041**: First line must be a top-level heading
- **MD047**: Files end with a single newline
