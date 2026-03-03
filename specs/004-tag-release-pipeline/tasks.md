# Tasks: Tag-Triggered Release Pipeline

**Input**: Design documents from `/specs/004-tag-release-pipeline/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story. All user stories are implemented in a single workflow file (`.github/workflows/release.yml`), so story phases build incrementally on the same file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Repository configuration required before the workflow can function

- [ ] T001 Configure `DOCKERHUB_USERNAME` repository secret in GitHub repo Settings → Secrets and variables → Actions
- [ ] T002 Configure `DOCKERHUB_TOKEN` repository secret in GitHub repo Settings → Secrets and variables → Actions (Docker Hub Personal Access Token with read/write scope)
- [ ] T002.5 Verify secrets exist by running `gh secret list --repo anmalkov/framory` and confirming both `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` appear

**Checkpoint**: Both secrets configured and verified — workflow implementation can begin

---

## Phase 2: User Story 1 — Push Tag to Trigger Automated Release (Priority: P1) 🎯 MVP

**Goal**: Pushing a `v*.*.*` tag triggers a pipeline that builds a Docker image, pushes it to Docker Hub, and creates a GitHub Release — fully automated end-to-end.

**Independent Test**: Push a tag like `v0.1.0` and verify: (1) workflow runs, (2) Docker image appears on Docker Hub, (3) GitHub Release is created.

### Implementation for User Story 1

- [x] T003 [US1] Create workflow file with trigger, permissions, and job skeleton in .github/workflows/release.yml
  - `on: push: tags: ['v*.*.*']`
  - Job-level `if` condition to exclude pre-release tags containing `-` or `+`
  - `permissions: contents: write` for release creation
  - Single job `release` on `ubuntu-latest`
- [x] T004 [US1] Add checkout and Docker login steps in .github/workflows/release.yml
  - `actions/checkout@v4`
  - `docker/login-action@v3` with `secrets.DOCKERHUB_USERNAME` and `secrets.DOCKERHUB_TOKEN`
- [x] T005 [US1] Add Docker metadata, Buildx setup, and build-push steps in .github/workflows/release.yml
  - `docker/setup-buildx-action@v3`
  - `docker/metadata-action@v5` with `images: anmalkov/framory` and semver tag patterns (`{{version}}`, `{{major}}.{{minor}}`, `{{major}}`)
  - `docker/build-push-action@v6` with `push: true`, cached layers (`type=gha,mode=max`), tags and labels from metadata step
- [x] T006 [US1] Add GitHub Release creation step in .github/workflows/release.yml
  - `gh release create` with `--generate-notes`, `--latest`, and `--title "Release ${{ github.ref_name }}"`
  - Uses `GITHUB_TOKEN` from `secrets.GITHUB_TOKEN`
  - Runs only after successful Docker push (sequential step ordering)
  - Handle re-pushed tags: if a release already exists for this tag, delete it first with `gh release delete` before creating a new one

**Checkpoint**: Full pipeline operational — tag push builds image, pushes to Docker Hub with semver tags, and creates GitHub Release with changelog. US1, US2, and US3 are all satisfied by this implementation.

---

## Phase 3: User Story 2 — Review Release with Changelog (Priority: P2)

**Goal**: GitHub Release includes a meaningful auto-generated changelog with all changes since the previous tag.

**Independent Test**: Push a tag after several commits and verify the release description lists all changes.

> **Note**: US2 is fully satisfied by T006 (`gh release create --generate-notes`). This phase adds optional customization.

### Implementation for User Story 2

- [x] T007 [P] [US2] Create release notes configuration in .github/release.yml
  - Define changelog categories (features, fixes, other)
  - Exclude bot authors (e.g., dependabot) from release notes
  - This file is optional — if omitted, GitHub uses default formatting

**Checkpoint**: Release notes are categorized and formatted per the configuration

---

## Phase 4: User Story 3 — Docker Image Versioning (Priority: P2)

**Goal**: Docker images are tagged with multi-level semver tags (`1.2.3`, `1.2`, `1`, `latest`) so consumers can pin or float.

**Independent Test**: Push a tag and verify Docker Hub shows all four expected tags.

> **Note**: US3 is fully satisfied by T005 (`docker/metadata-action` semver patterns). No additional tasks required.

**Checkpoint**: Multi-level semver tagging verified on Docker Hub

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and validation

- [x] T008 [P] Update docs/development.md with release workflow instructions (how to create a release, what tags to push, how to verify)
- [ ] T009 Run quickstart.md validation — push a test tag and verify end-to-end pipeline execution
  - Verify first-ever tag produces a full-history changelog (FR-008)
  - Push a second tag to verify rolling tags (`major`, `minor`, `latest`) update correctly (FR-005)
  - Confirm the GitHub Release is marked as latest (FR-012)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No code dependencies — requires manual secret configuration in GitHub
- **US1 (Phase 2)**: Depends on Phase 1 secrets being configured
- **US2 (Phase 3)**: Independent of Phase 2 (different file), can run in parallel
- **US3 (Phase 4)**: No additional tasks — satisfied by Phase 2 implementation
- **Polish (Phase 5)**: Depends on Phase 2 completion for end-to-end validation

### User Story Dependencies

- **User Story 1 (P1)**: Core pipeline — all other stories are naturally satisfied by its implementation
- **User Story 2 (P2)**: Optional enhancement (release notes customization) — independent file, can be done in parallel with US1
- **User Story 3 (P2)**: No separate tasks — `docker/metadata-action` semver patterns in T005 handle all tagging

### Parallel Opportunities

- T001 and T002 can run in parallel (independent secrets)
- T007 can run in parallel with T003–T006 (different file: `.github/release.yml` vs `.github/workflows/release.yml`)
- T008 can run in parallel with any implementation task (different file: `docs/development.md`)

---

## Parallel Example: Phase 2 + Phase 3

```bash
# These can be done simultaneously (different files):
Task T003-T006: Build .github/workflows/release.yml (US1 - core pipeline)
Task T007:      Create .github/release.yml (US2 - release notes config)
Task T008:      Update docs/development.md (Polish - documentation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Configure secrets (T001, T002)
2. Complete Phase 2: Create workflow file (T003–T006)
3. **STOP and VALIDATE**: Push a test tag, verify Docker Hub + GitHub Release
4. This delivers all three user stories — the action choices satisfy US2 and US3 inherently

### Incremental Delivery

1. Configure secrets → Secrets ready
2. Create core workflow → Push test tag → Verify (MVP!)
3. Add release notes config → Push another tag → Verify improved changelog
4. Update docs → Feature complete

---

## Notes

- The entire feature is 1 new workflow file (~60 lines YAML) + 1 optional config file + 1 doc update
- US2 and US3 are architecturally satisfied by the action choices in US1 — no separate implementation needed
- T009 (quickstart validation) requires an actual tag push to GitHub — cannot be tested locally
- Secrets (T001, T002) are manual configuration steps, not code tasks
