# Quickstart: Tag-Triggered Release Pipeline

**Feature**: 004-tag-release-pipeline  
**Date**: 2026-03-03

## Prerequisites

1. A Docker Hub account with a repository named `framory` (or matching the GitHub repo name)
2. A Docker Hub Personal Access Token with `read,write` scope
3. GitHub repository admin access (to configure secrets)

## Setup (One-Time)

### 1. Create Docker Hub Personal Access Token

1. Go to [Docker Hub → Account Settings → Security](https://hub.docker.com/settings/security)
2. Click **New Access Token**
3. Name: `github-actions-framory`
4. Scope: **Read & Write**
5. Copy the generated token

### 2. Configure GitHub Repository Secrets

1. Go to GitHub repo → **Settings → Secrets and variables → Actions**
2. Add two repository secrets:
   - `DOCKERHUB_USERNAME` → your Docker Hub username
   - `DOCKERHUB_TOKEN` → the Personal Access Token from step 1

### 3. Add the Workflow File

The workflow file will be at `.github/workflows/release.yml`. It is created as part of this feature implementation.

## Usage

### Create a Release

```bash
# Tag the current commit with a semver version
git tag v1.0.0

# Push the tag to trigger the pipeline
git push origin v1.0.0
```

### What Happens Automatically

1. GitHub Actions workflow triggers on the tag push
2. Docker image builds from the repository Dockerfile
3. Image is pushed to Docker Hub with tags: `1.0.0`, `1.0`, `1`, `latest`
4. GitHub Release is created with auto-generated changelog

### Verify the Release

- **Docker Hub**: `docker pull <username>/framory:1.0.0`
- **GitHub**: Check the Releases page for `v1.0.0` with changelog

### Subsequent Releases

```bash
git tag v1.0.1
git push origin v1.0.1
# → Docker tags: 1.0.1, 1.0, 1, latest (rolling tags updated)
# → New GitHub Release for v1.0.1
```

## Tags That Do NOT Trigger the Pipeline

```bash
git tag v1.0.0-rc1    # Pre-release — ignored
git tag v1.0.0-beta.1 # Pre-release — ignored
git tag test-build     # Non-semver — ignored
git tag latest         # Non-semver — ignored
```
