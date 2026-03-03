# Implementation Plan: Tag-Triggered Release Pipeline

**Branch**: `004-tag-release-pipeline` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-tag-release-pipeline/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a GitHub Actions workflow that triggers on semver tag pushes (`v*.*.*`), builds the Docker image from the existing multi-stage Dockerfile, pushes it to Docker Hub (`anmalkov/framory`) with multi-level semver tags (`1.2.3`, `1.2`, `1`, `latest`), and creates a GitHub Release with auto-generated changelog. Uses `docker/metadata-action` for tag computation, `docker/build-push-action` for the build, and the `gh` CLI with `--generate-notes` for the changelog. No application code changes — the entire feature is a single workflow YAML file plus repository secret configuration.

## Technical Context

**Language/Version**: GitHub Actions workflow (YAML), no application code changes
**Primary Dependencies**: GitHub Actions (`actions/checkout@v4`, `docker/login-action@v3`, `docker/metadata-action@v5`, `docker/build-push-action@v6`, `gh` CLI for release creation)
**Storage**: N/A — no database or file storage changes
**Testing**: Manual validation via tag push; can also validate YAML syntax with `actionlint`
**Target Platform**: GitHub-hosted runners (`ubuntu-latest`)
**Project Type**: CI/CD pipeline (GitHub Actions workflow)
**Performance Goals**: Pipeline completes within 10 minutes (multi-stage Docker build with npm + pip install)
**Constraints**: Docker Hub rate limits (200 pulls/6h for free accounts), GitHub Actions free tier minutes (2000 min/month for private repos, unlimited for public)
**Scale/Scope**: Single workflow file (~60 lines YAML), two repository secrets to configure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality** | ✅ PASS | Single YAML workflow with no logic duplication. Pinned action versions (`@v4`, `@v3`, etc.) prevent supply-chain drift. |
| **II. Simplicity** | ✅ PASS | Uses well-established community actions instead of custom scripts. `docker/metadata-action` handles all tag computation — no shell scripting needed. Single file addition, no abstractions. |
| **III. UX Consistency** | N/A | No UI changes — this is purely CI/CD infrastructure. |
| **IV. Performance** | ✅ PASS | Multi-stage Docker build with layer caching. Pipeline budget is 10 minutes, well within expectations for npm + pip + Docker push. |

**Gate Result**: PASS

### Post-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality** | ✅ PASS | Workflow uses only pinned major-version actions. Secrets are referenced by name, never hardcoded. Conditional step ordering ensures no partial releases. |
| **II. Simplicity** | ✅ PASS | One file, five action steps plus a single `gh` CLI call. `docker/metadata-action` encapsulates semver tag parsing — no regex or shell manipulation needed. |
| **III. UX Consistency** | N/A | No UI changes. |
| **IV. Performance** | ✅ PASS | Docker layer caching via GitHub Actions cache backend (`type=gha`). Image build reuses multi-stage Dockerfile as-is. |

**Gate Result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/004-tag-release-pipeline/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── docs-lint.yml     # Existing — markdown linting on docs changes
    └── release.yml       # NEW — tag-triggered release pipeline
```

**Structure Decision**: Single workflow file added to the existing `.github/workflows/` directory. No contracts directory needed — the feature has no external API surfaces; it is an internal CI/CD automation with no consumer-facing interface beyond Docker Hub tags and GitHub Releases, both of which are standard platform conventions.

## Complexity Tracking

> No constitution violations — table intentionally left empty.
