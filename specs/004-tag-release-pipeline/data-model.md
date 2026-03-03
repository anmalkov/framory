# Data Model: Tag-Triggered Release Pipeline

**Feature**: 004-tag-release-pipeline  
**Date**: 2026-03-03

## Overview

This feature has no database entities or application-level data models. It operates entirely within GitHub Actions and Docker Hub infrastructure. The "entities" below describe the configuration and artifacts the pipeline produces.

## Entities

### Version Tag (Input Trigger)

| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | Git tag name, e.g., `v1.2.3` |
| pattern | regex | `^v[0-9]+\.[0-9]+\.[0-9]+$` (no pre-release, no build metadata) |
| ref | string | Full git ref, e.g., `refs/tags/v1.2.3` |

**Validation rules**:
- Must start with `v` followed by three dot-separated numeric segments
- Must not contain `-` (pre-release) or `+` (build metadata) characters

### Docker Image Tags (Output)

Derived from a version tag `v{major}.{minor}.{patch}`:

| Tag | Example | Rolling? |
|-----|---------|----------|
| `{major}.{minor}.{patch}` | `1.2.3` | No (immutable) |
| `{major}.{minor}` | `1.2` | Yes (updated by patch releases) |
| `{major}` | `1` | Yes (updated by minor/patch releases) |
| `latest` | `latest` | Yes (always points to newest) |

### GitHub Release (Output)

| Attribute | Source | Description |
|-----------|--------|-------------|
| tag_name | Push event | The triggering tag, e.g., `v1.2.3` |
| title | Workflow | `Release v1.2.3` |
| body | GitHub API | Auto-generated changelog (commits + PRs since previous tag) |
| latest | Workflow | `true` — marked as latest release |

### Repository Secrets (Configuration)

| Secret | Purpose | Scope |
|--------|---------|-------|
| `DOCKERHUB_USERNAME` | Docker Hub login username | Repository |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token (read/write) | Repository |
| `GITHUB_TOKEN` | GitHub Release creation | Built-in (automatic) |

## Relationships

```
Version Tag (push event)
    │
    ├──▶ Docker Image (built and pushed)
    │       ├── tag: {major}.{minor}.{patch}
    │       ├── tag: {major}.{minor}
    │       ├── tag: {major}
    │       └── tag: latest
    │
    └──▶ GitHub Release (created after successful push)
            ├── tag_name: v{major}.{minor}.{patch}
            └── body: changelog since previous tag
```

## State Transitions

```
Tag Pushed ──▶ Pipeline Triggered ──▶ Docker Build
                                          │
                                    ┌─────┴─────┐
                                    │            │
                                 Success      Failure
                                    │            │
                              Docker Push    Pipeline Stops
                                    │        (no release)
                              GitHub Release
                                    │
                                 Complete
```
