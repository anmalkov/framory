# Research: Project Documentation

**Feature**: 002-project-documentation
**Date**: 2026-03-03

## R1: Markdown Lint Tool Selection

**Decision**: Use **markdownlint-cli2** (v0.21.0) as the markdown linter.

**Rationale**:

- De facto standard for markdown linting in the Node.js ecosystem (5.9k stars for markdownlint, 708 stars for markdownlint-cli2, 69k+ dependents)
- First-party GitHub Action available: `DavidAnson/markdownlint-cli2-action@v22`
- Configuration-based, prioritizes speed and simplicity
- Works with the `vscode-markdownlint` VS Code extension — same config file, same rules, same behavior in editor and CI
- Supports CommonMark and GitHub Flavored Markdown (GFM) including tables, autolinks, and math syntax
- MIT licensed
- 60+ built-in rules covering headings, lists, code blocks, links, whitespace, and more
- Supports auto-fix (`--fix`) for many rules

**Alternatives considered**:

| Tool | Why rejected |
|------|-------------|
| markdownlint-cli (v1) | Older CLI, less feature-rich config; markdownlint-cli2 is the recommended successor by the same author |
| remark-lint | More powerful but complex ecosystem; requires multiple plugins; excessive for linting 4 doc files |
| mdl (Ruby) | Different runtime (Ruby); project already has Node.js in the frontend toolchain |
| Super-Linter | Overkill — lints many languages, heavy Docker image, slow for just markdown |

## R2: GitHub Actions Workflow Configuration

**Decision**: Use `DavidAnson/markdownlint-cli2-action@v22` in a dedicated workflow file with `paths` filter.

**Rationale**:

- First-party action maintained by the markdownlint author
- Simple inputs: `globs` to specify which files to lint
- Supports `config` input for custom config file paths
- Workflow `paths` filter ensures the job only runs when `docs/**`, `README.md`, or `.markdownlint.json` change — no wasted CI minutes on code-only PRs
- Latest stable version: v22 (released with markdownlint-cli2 v0.21.0)

**Implementation approach**:

- Workflow triggers: `push` to `main` + `pull_request` (with `paths` filter)
- Globs: `README.md` and `docs/*.md`
- Workflow file: `.github/workflows/docs-lint.yml`

## R3: Markdownlint Rule Configuration

**Decision**: Use `.markdownlint.json` config file at repo root with sensible defaults and minimal rule customization.

**Rationale**:

- `.markdownlint.json` is the simplest config format (pure JSON, no JSONC needed)
- Supported by both markdownlint-cli2 (CI) and vscode-markdownlint (editor) — single source of truth
- Located at repo root for automatic discovery by both tools
- Start with all rules enabled (default), then disable only rules that conflict with the project's documentation style

**Rules to customize**:

| Rule | Setting | Reason |
|------|---------|--------|
| MD013 (line-length) | `false` | Documentation uses long lines for readability in editors; GitHub renders markdown with word wrap |
| MD033 (no-inline-html) | `false` | README may use HTML for badges, image sizing, or alignment |
| MD041 (first-line-h1) | `true` (default) | All doc files should start with a top-level heading |
| MD024 (no-duplicate-heading) | `{ "siblings_only": true }` | Allow same heading text in different sections (e.g., "Overview" under different parent headings) |

## R4: README Best Practices for Open Source

**Decision**: Follow the standard open-source README structure used by major projects.

**Rationale**: Based on patterns from popular open-source projects (Electron, webpack, ESLint, .NET Docs) and common community guidelines.

**Standard sections in order**:

1. **Title + badges** — Project name, tagline, shields.io badges
2. **Visual preview** — Screenshot or GIF (placeholder with instructions)
3. **Features** — Bullet list of key capabilities
4. **Quick Start** — Minimal steps to get running (Docker)
5. **Documentation** — Links to docs/usage.md, docs/development.md, docs/architecture.md
6. **Contributing** — How to contribute, link to dev guide
7. **License** — License type + link to LICENSE file

**Badge sources**: shields.io for license, Python version, Node.js version, and build status (once CI exists)

## R5: Mermaid Diagram Support on GitHub

**Decision**: Use Mermaid syntax in fenced code blocks for all diagrams.

**Rationale**:

- GitHub natively renders Mermaid diagrams in markdown files (since 2022)
- No external tools, image generation, or hosting needed
- Diagrams are version-controlled as text, easy to diff and update
- Supported diagram types needed: `graph TD` (architecture), `sequenceDiagram` (flows)
- VS Code renders Mermaid in preview with the built-in markdown preview

## R6: License File

**Decision**: Create a MIT LICENSE file at the repo root (no LICENSE file currently exists).

**Rationale**:

- The README spec (FR-007) requires a License section referencing a license file
- MIT is the most common permissive open-source license, consistent with the project's dependencies (markdownlint: MIT, FastAPI: MIT, React: MIT)
- Spec assumption states "MIT or similar permissive open-source license"

## R7: Documentation Location Convention

**Decision**: Place docs in `docs/` directory at repo root.

**Rationale**:

- Standard convention for project documentation (GitHub, GitLab, Bitbucket all recognize this)
- Separates documentation from spec/planning artifacts in `specs/`
- Path `docs/**` works cleanly with GitHub Actions `paths` filter
- GitHub renders markdown files in `docs/` with full link resolution
