# Feature Specification: Project Documentation

**Feature Branch**: `002-project-documentation`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "I want to create documentation for this project. I want to have: readme.md using open source community best practices, docs/development.md with everything about development (setup, run, debug, test), architecture.md with architecture diagram (mermaid), detailed architecture explanation, sequence diagrams for main flows, and docs/usage.md as a short user manual."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - README for First Impressions (Priority: P1)

A new visitor discovers the Framory repository on GitHub. They land on the README and within seconds understand what the project does, see a screenshot of the photo frame in action, and find clear instructions to get started. They can quickly assess whether the project fits their needs and how to install it.

**Why this priority**: The README is the front door of any open-source project. Without a clear, well-structured README, potential users and contributors bounce immediately. It delivers standalone value as the single most important documentation artifact.

**Independent Test**: Can be validated by having someone unfamiliar with the project read only the README and successfully answer: "What does this project do?", "How do I install it?", and "How do I contribute?"

**Acceptance Scenarios**:

1. **Given** a visitor opens the repository on GitHub, **When** they read the README, **Then** they understand the project purpose, see a visual preview, and find installation instructions within 2 minutes
2. **Given** a user wants to run Framory at home, **When** they follow the Quick Start section in the README, **Then** they are directed to the correct detailed guide and can get the system running
3. **Given** a developer wants to contribute, **When** they look at the README, **Then** they find a Contributing section with links to development setup and project guidelines
4. **Given** a user wants to know the project license, **When** they check the README, **Then** the license type is clearly stated with a link to the full license file

---

### User Story 2 - Developer Onboarding Guide (Priority: P1)

A developer (new contributor or the project owner returning after time away) wants to set up a local development environment, run the project, debug issues, and execute tests. They open `docs/development.md` and follow the step-by-step instructions to go from zero to a fully working dev setup.

**Why this priority**: Without a development guide, no one can contribute to the project effectively. This is equally critical as the README because it enables the development workflow. It delivers standalone value as the complete developer reference.

**Independent Test**: Can be validated by having a developer with the required tools (Python, Node.js) follow the guide from scratch on a clean machine and successfully run both backend and frontend with passing tests.

**Acceptance Scenarios**:

1. **Given** a developer with Python and Node.js installed, **When** they follow the prerequisites and setup steps, **Then** they have a working local dev environment within 15 minutes
2. **Given** a developer has the environment set up, **When** they follow the "Running Locally" section, **Then** both backend and frontend start successfully and they can access the application in a browser
3. **Given** a developer wants to run tests, **When** they follow the testing section, **Then** they can execute backend unit tests, integration tests, frontend tests, linting, and type checking
4. **Given** a developer encounters a bug, **When** they consult the debugging section, **Then** they find guidance on how to debug both backend and frontend components
5. **Given** a developer wants to build for production, **When** they follow the Docker build instructions, **Then** they can build and run the Docker image locally

---

### User Story 3 - Architecture Understanding (Priority: P2)

A developer or technical stakeholder wants to understand how Framory is designed — the system components, how they interact, the data flow for key operations, and the rationale behind architectural decisions. They open `docs/architecture.md` and find visual diagrams alongside clear explanations.

**Why this priority**: Architecture documentation is essential for informed contributions and technical decision-making, but has lower immediate urgency than the README and dev guide. A developer can still contribute with the first two docs; this one accelerates deeper understanding.

**Independent Test**: Can be validated by having a developer read the architecture doc and correctly describe: the system's main components, how a photo is displayed on a tablet, and how multi-device synchronization works.

**Acceptance Scenarios**:

1. **Given** a developer opens the architecture document, **When** they view the high-level architecture diagram, **Then** they can identify all major system components and their relationships
2. **Given** a developer wants to understand real-time sync, **When** they read the WebSocket flow sequence diagram, **Then** they understand the message exchange between clients and server during photo synchronization
3. **Given** a developer wants to understand the photo serving pipeline, **When** they read the photo request sequence diagram, **Then** they understand how a photo goes from NAS storage to a tablet screen
4. **Given** a technical stakeholder reviews the document, **When** they read the architectural decisions section, **Then** they understand why key technology and design choices were made

---

### User Story 4 - User Manual for Day-to-Day Usage (Priority: P2)

A non-technical user (family member, household member) has Framory already running and wants to learn how to use it — create channels, connect tablets, control the slideshow, and adjust settings. They open `docs/usage.md` and find a concise, jargon-free guide with clear steps for every common task.

**Why this priority**: Once Framory is deployed, users need to know how to operate it without reading developer docs. This is a standalone reference that complements the README (which stays high-level) and doesn't require any technical background. Equal priority to architecture since both serve different but important audiences.

**Independent Test**: Can be validated by having a non-technical person follow the usage guide and successfully create a channel, open it on a tablet, control playback, and change the photo folder — without any other documentation or help.

**Acceptance Scenarios**:

1. **Given** a user has Framory running on their network, **When** they follow the "Creating a Channel" section, **Then** they can navigate to the landing page and create a new channel with a name of their choice
2. **Given** a user has created a channel, **When** they follow the "Connecting a Device" section, **Then** they can open the channel URL on a tablet browser and see photos displayed in fullscreen
3. **Given** a user is viewing a channel on a tablet, **When** they follow the "Controlling Playback" section, **Then** they understand how to play, stop, go to next/previous photo using tap controls and swipe gestures
4. **Given** a user wants to change which photos are shown, **When** they follow the "Settings" section, **Then** they can change the photo folder, adjust the delay between photos, and set a daily stop time
5. **Given** multiple tablets are connected to the same channel, **When** a user controls playback from any device, **Then** the guide explains that all devices stay synchronized

---

### User Story 5 - Documentation Quality Gate (Priority: P3)

A contributor edits a documentation file and pushes their changes. An automated check validates that all markdown files follow consistent formatting rules — correct heading hierarchy, no broken internal links, no trailing whitespace, etc. If something is off, the check fails and the contributor knows exactly what to fix before merging.

**Why this priority**: The four documentation files are the foundation; this story prevents them from degrading over time. Lower priority because the docs must exist before quality enforcement adds value.

**Independent Test**: Can be validated by introducing a deliberate formatting error in a doc file and confirming the automated check catches it, and by verifying the check does not run for non-documentation changes.

**Acceptance Scenarios**:

1. **Given** a contributor modifies a file in `docs/` or `README.md`, **When** they push their changes, **Then** an automated formatting check runs and reports any violations
2. **Given** all documentation files are properly formatted, **When** the check runs, **Then** it passes without errors
3. **Given** a contributor modifies only backend or frontend code, **When** they push their changes, **Then** the documentation formatting check does not run
4. **Given** a formatting violation is detected, **When** the contributor views the check results, **Then** they see the specific file, line, and rule violated

---

### Edge Cases

- What happens when the project structure changes — how are docs kept in sync?
- What if a developer is on Windows vs. macOS vs. Linux — are platform-specific instructions covered?
- What if a section references configuration values that have changed — are defaults documented from a single source of truth?
- What happens when diagrams reference components that don't exist yet — are future/planned components clearly distinguished?

## Requirements *(mandatory)*

### Functional Requirements

#### README.md

- **FR-001**: README MUST include a project title, concise tagline, and a brief description explaining what Framory does and who it is for
- **FR-002**: README MUST include a visual preview (screenshot or GIF placeholder with instructions for adding one) showing the photo frame in action
- **FR-003**: README MUST include a "Features" section listing key capabilities (multi-device sync, channel-based display, NAS integration, kiosk UI, etc.)
- **FR-004**: README MUST include a "Quick Start" section with the minimal steps to get Framory running (Docker one-liner referencing the development guide for full setup)
- **FR-005**: README MUST include a "Documentation" section linking to `docs/usage.md`, `docs/development.md`, and `docs/architecture.md`
- **FR-006**: README MUST include a "Contributing" section with guidelines for how to contribute (linking to development guide, branch naming conventions, PR process)
- **FR-007**: README MUST include a "License" section stating the license type
- **FR-008**: README MUST include badges for license, Python version, and Node.js version; a build status badge MUST be added once CI exists
- **FR-009**: README MUST follow the standard open-source section order (title+badges, visual preview, features, quick start, documentation links, contributing, license) with scannable headings and no implementation jargon in overview sections

#### docs/usage.md

- **FR-010**: Usage guide MUST include a brief introduction explaining that Framory turns any browser into a synchronized digital photo frame and that this guide covers everyday operation
- **FR-011**: Usage guide MUST include a "Creating a Channel" section explaining how to navigate to the landing page and create a new channel by entering a name
- **FR-012**: Usage guide MUST include a "Connecting a Device" section explaining how to open a channel URL on a tablet/phone browser and enable fullscreen mode
- **FR-013**: Usage guide MUST include a "Controlling Playback" section explaining play, stop, next, and previous controls — both tap-to-reveal overlay buttons and swipe gestures (left = next, right = previous)
- **FR-014**: Usage guide MUST include a "Settings" section explaining how to change the photo folder, adjust the delay between photos, and set a daily stop time via the settings panel
- **FR-015**: Usage guide MUST include a "Multi-Device Sync" section explaining that all devices on the same channel show the same photo and respond to commands from any device
- **FR-016**: Usage guide MUST be written in plain, non-technical language suitable for family members with no development background

#### docs/development.md

- **FR-017**: Development guide MUST include a "Prerequisites" section listing required tools and minimum versions (Python, Node.js, Docker)
- **FR-018**: Development guide MUST include step-by-step instructions for setting up the backend development environment (virtual environment, dependencies, configuration)
- **FR-019**: Development guide MUST include step-by-step instructions for setting up the frontend development environment (npm install, environment variables)
- **FR-020**: Development guide MUST include a "Running Locally" section explaining how to start both backend and frontend for development, including the Vite proxy configuration
- **FR-021**: Development guide MUST include a "Testing" section covering how to run backend unit tests, integration tests, frontend tests, linting, and type checking
- **FR-022**: Development guide MUST include a "Debugging" section with guidance on debugging backend (uvicorn reload, logs) and frontend (browser devtools, Vite HMR)
- **FR-023**: Development guide MUST include a "Docker Build" section explaining how to build and run the production Docker image locally
- **FR-024**: Development guide MUST include a "Project Structure" section explaining the directory layout and where key files live
- **FR-025**: Development guide MUST include a "Code Style & Conventions" section documenting linting tools (ruff, mypy, eslint), formatting standards, and naming conventions used in the project

#### docs/architecture.md

- **FR-026**: Architecture document MUST include a high-level architecture diagram (Mermaid) showing all major system components: browser clients, FastAPI backend, NFS photo storage, and SQLite database
- **FR-027**: Architecture document MUST include a detailed written explanation of each architectural component (REST API, WebSocket handler, ChannelManager, PhotoService, Scheduler, DB service)
- **FR-028**: Architecture document MUST include a sequence diagram (Mermaid) for the client connection and initial sync flow (WebSocket connect → state broadcast)
- **FR-029**: Architecture document MUST include a sequence diagram (Mermaid) for the photo advance flow (timer fires → next photo → broadcast to all clients)
- **FR-030**: Architecture document MUST include a sequence diagram (Mermaid) for a playback command flow (user taps play/stop → command sent → state updated → broadcast)
- **FR-031**: Architecture document MUST include a "Data Model" section explaining the Channel entity, playback states, and photo metadata
- **FR-032**: Architecture document MUST include an "Architectural Decisions" section documenting key design choices and their rationale (e.g., SQLite over Postgres, WebSocket over SSE, JPEG-only serving, single-instance design)
- **FR-033**: Architecture document MUST include a "Deployment Architecture" section with a diagram showing k8s/Docker deployment topology including NFS volumes and persistent storage

#### Documentation Quality

- **FR-034**: All markdown documentation files (README.md and files in `docs/`) MUST pass an automated formatting and style check (markdownlint-cli2) that enforces consistent heading hierarchy and clean formatting. Internal link validity MUST be verified manually during the polish phase (T009)
- **FR-035**: The project MUST include an automated CI check that runs the markdown formatting validation only when documentation files (`docs/**` or `README.md`) are changed

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can understand Framory's purpose and features within 2 minutes of reading the README
- **SC-002**: A developer can go from zero to a running local development environment by following only the development guide, without needing to ask questions or consult other sources
- **SC-003**: All four documentation files are internally consistent — component names, configuration values, and paths match the actual codebase
- **SC-004**: The architecture document contains at least 5 Mermaid diagrams (1 architecture overview + 3 sequence diagrams + 1 deployment diagram) that render correctly in GitHub's markdown viewer
- **SC-005**: 100% of the steps in the development guide are accurate and reproducible on a clean setup
- **SC-006**: The README follows established open-source conventions and includes all standard sections (description, features, quick start, docs links, contributing, license)
- **SC-007**: A developer reading only the architecture document can correctly explain the system's main components and the flow of a photo being displayed on a synchronized tablet
- **SC-008**: A non-technical user can follow the usage guide and successfully create a channel, connect a device, and control playback without consulting any other documentation
- **SC-009**: Documentation formatting violations are caught automatically before merge, and the check does not trigger for non-documentation changes

## Assumptions

- The project is hosted on GitHub and documentation should be optimized for GitHub's markdown rendering (including Mermaid diagram support)
- The project currently uses an MIT or similar permissive open-source license (the License section will reference the existing LICENSE file or a placeholder if none exists)
- Screenshots/GIFs of the running application will use placeholder text with instructions for adding actual images, since generating screenshots is outside the scope of documentation writing
- Platform-specific instructions will primarily target Linux/macOS with notes for Windows where commands differ (e.g., virtual environment activation)
- The `docs/` directory will be created at the repository root alongside the existing `specs/` directory
- Configuration defaults documented will reflect the values currently in the codebase (ConfigMap, pyproject.toml, vite.config.ts)
- The usage guide (`docs/usage.md`) is a standalone document aimed at non-technical users who already have Framory running; it does not cover installation or deployment details (those are in Quick Start and the development guide)
- Edge cases (platform-specific command differences, config value drift, future/planned components in diagrams) are deferred: platform-specific notes for Windows are included where commands differ (e.g., venv activation); config values are documented from current codebase sources; diagrams reflect only existing components — future components are out of scope for this feature
