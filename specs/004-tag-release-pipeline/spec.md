# Feature Specification: Tag-Triggered Release Pipeline

**Feature Branch**: `004-tag-release-pipeline`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "when i push a tag, that should be in a format of v0.0.0, to github i want to start the release pipeline that will build a docker image and push it to docker hub then publish a new release on github with all the changes in the description."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Push Tag to Trigger Automated Release (Priority: P1)

As a developer, I want to push a version tag (e.g., `v1.2.0`) to the GitHub repository and have the entire release process happen automatically — a Docker image is built and published, and a GitHub Release is created with a changelog — so I can ship new versions with a single `git tag && git push` without any manual steps.

**Why this priority**: This is the core value of the feature. Without the automated pipeline triggered by a tag push, nothing else matters. It eliminates manual release steps and ensures every tagged version is consistently built and published.

**Independent Test**: Can be fully tested by pushing a semver tag to the repository and verifying that a Docker image appears on Docker Hub and a GitHub Release is published with a description listing changes since the previous tag.

**Acceptance Scenarios**:

1. **Given** the repository has commits since the last tag, **When** I push a tag matching `v*.*.*` (e.g., `v1.0.0`), **Then** the release pipeline starts automatically
2. **Given** the pipeline is running, **When** the build completes successfully, **Then** a Docker image is pushed to Docker Hub with multiple tags: full version (`1.0.0`), minor (`1.0`), major (`1`), and `latest`
3. **Given** the Docker image was published, **When** the pipeline continues, **Then** a GitHub Release is created for the pushed tag with an auto-generated description listing all changes since the previous tag
4. **Given** a tag that does not match the `v*.*.*` pattern (e.g., `test-123`, `beta1`), **When** it is pushed, **Then** the release pipeline does NOT trigger

---

### User Story 2 - Review Release with Changelog (Priority: P2)

As a developer, I want the GitHub Release to include a meaningful description of all changes since the previous version tag so I can easily review what shipped and share release notes with others.

**Why this priority**: A published release without a changelog has limited value. Including changes makes releases informative and useful for anyone consuming the project.

**Independent Test**: Can be tested by pushing a new tag after several commits and verifying the GitHub Release description contains the commit messages or PR titles since the previous tag.

**Acceptance Scenarios**:

1. **Given** there are 5 commits between `v1.0.0` and `v1.1.0`, **When** I push `v1.1.0`, **Then** the release description includes references to all 5 changes
2. **Given** this is the first-ever tag (`v0.1.0`), **When** I push it, **Then** the release description includes all changes from the beginning of the repository
3. **Given** the release is published, **When** I view it on GitHub, **Then** the description is human-readable and organized

---

### User Story 3 - Docker Image Versioning (Priority: P2)

As a consumer of the Docker image, I want the image to be tagged with multiple semver levels — full version, minor, major, and `latest` — so I can pin to an exact version for production, float on a minor/major line for automatic patch updates, or always get the newest build.

**Why this priority**: Proper image tagging is essential for production deployments and aligns with Docker community conventions.

**Independent Test**: Can be tested by verifying Docker Hub after a tag push shows all four expected tags (`1.2.3`, `1.2`, `1`, `latest`) pointing to the same image.

**Acceptance Scenarios**:

1. **Given** I push tag `v2.0.0`, **When** the pipeline completes, **Then** Docker Hub has images tagged `2.0.0`, `2.0`, `2`, and `latest`
2. **Given** I push tag `v2.0.1` after `v2.0.0`, **When** the pipeline completes, **Then** `latest`, `2.0`, and `2` all point to the `v2.0.1` image, while `2.0.0` still points to the previous build

---

### Edge Cases

- What happens when the Docker build fails? The pipeline should not create a GitHub Release; the failure should be visible in the pipeline run.
- What happens when a tag is deleted and re-pushed? The pipeline should run again for the re-pushed tag. If the GitHub Release already exists, it should be updated rather than duplicated.
- What happens when two tags are pushed in quick succession? Each tag triggers its own independent pipeline run.
- What happens when the tag format includes a pre-release suffix (e.g., `v1.0.0-rc1`)? The pipeline should NOT trigger — only strict `v*.*.*` tags without suffixes are supported.
- What happens if Docker Hub credentials are misconfigured? The pipeline should fail with a clear error and not create a GitHub Release.
- What happens if the repository has no previous tags? The changelog should include all commits from the beginning of the repository history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The pipeline MUST trigger automatically when a Git tag matching the pattern `v*.*.*` (semantic versioning: major.minor.patch) is pushed to the GitHub repository
- **FR-002**: The pipeline MUST NOT trigger for tags that do not match the `v*.*.*` pattern (e.g., `test-1`, `v1.0.0-rc1`, `latest`)
- **FR-003**: The pipeline MUST build a Docker image from the repository's existing Dockerfile
- **FR-004**: The pipeline MUST push the built Docker image to Docker Hub with multiple tags derived from the version number (without the `v` prefix): full version (`1.2.3`), minor (`1.2`), major (`1`), and `latest` (e.g., tag `v1.2.3` produces image tags `1.2.3`, `1.2`, `1`, `latest`)
- **FR-005**: The minor, major, and `latest` tags MUST be rolling — each new release overwrites them to point to the newest image at that level
- **FR-006**: The pipeline MUST create a GitHub Release associated with the pushed tag
- **FR-007**: The GitHub Release description MUST include all changes (commits and/or merged pull requests) since the previous version tag
- **FR-008**: If no previous version tag exists, the release description MUST include all changes from the beginning of the repository
- **FR-009**: If the Docker build or push step fails, the pipeline MUST NOT create a GitHub Release
- **FR-010**: The pipeline MUST use stored secrets for Docker Hub authentication (username and token) — credentials MUST NOT be hardcoded
- **FR-011**: The pipeline MUST use the repository's built-in token for GitHub Release creation — no additional tokens required
- **FR-012**: The GitHub Release MUST be marked as the latest release

### Key Entities

- **Version Tag**: A Git tag following `v*.*.*` format that triggers the release pipeline. Represents a point-in-time snapshot of the codebase intended for release.
- **Docker Image**: The built container artifact, published to Docker Hub with multiple semver tags (full version, minor, major, and `latest`). Derived from the repository's Dockerfile.
- **GitHub Release**: A release entry on GitHub tied to a version tag, containing a changelog of all changes since the prior version tag.
- **Changelog**: An auto-generated summary of changes (commits/PRs) between the current tag and the previous tag, used as the GitHub Release description.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pushing a valid version tag results in a Docker image appearing on Docker Hub within 10 minutes
- **SC-002**: Every version-tagged release has a corresponding GitHub Release with a non-empty changelog
- **SC-003**: The release process requires zero manual steps after pushing the tag — fully automated end-to-end
- **SC-004**: Invalid tag formats (non-semver, pre-release suffixes) produce zero pipeline runs
- **SC-005**: A build failure prevents partial releases — no GitHub Release is created if the Docker image fails to publish

## Assumptions

- The repository is hosted on GitHub and uses GitHub Actions for CI/CD
- The existing multi-stage Dockerfile in the repository root is used as-is for building the Docker image
- Docker Hub is the target container registry; the repository owner has a Docker Hub account and will store credentials as GitHub repository secrets
- GitHub's built-in auto-generated release notes feature is sufficient for changelog generation (uses commit messages and PR titles)
- The Docker Hub image name is `anmalkov/framory`
- Only strict semver tags (`v*.*.*`) trigger the pipeline — pre-release tags (`v1.0.0-rc1`, `v1.0.0-beta.1`) are excluded from the pipeline scope
