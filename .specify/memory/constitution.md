<!--
  Sync Impact Report
  ==================
  Version change: N/A (template) → 1.0.0
  Modified principles: None (initial creation)
  Added sections:
    - Core Principles (4): Code Quality, Simplicity,
      UX Consistency, Performance
    - Development Standards
    - Quality Gates
    - Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed
      (Constitution Check uses dynamic reference)
    - .specify/templates/spec-template.md ✅ no update needed
      (generic structure, no principle-specific refs)
    - .specify/templates/tasks-template.md ✅ no update needed
      (generic phases, aligns with new principles)
    - .specify/templates/checklist-template.md ✅ no update needed
  Follow-up TODOs: None
-->

# Framory Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

Every code change MUST meet measurable quality standards
before merging:

- All production code MUST pass static analysis with zero
  warnings (linter, type checker, formatter).
- Functions MUST have a single responsibility. If a function
  requires more than one descriptive verb to explain, it MUST
  be split.
- Dead code, unused imports, and commented-out blocks MUST be
  removed before merge.
- Naming MUST be descriptive and consistent: variables reveal
  intent, booleans read as questions (`isLoading`, `hasError`),
  handlers follow `handle<Event>` convention.
- Code duplication across modules MUST be extracted when the
  same logic appears in three or more locations.
- All public API surfaces (components, hooks, service functions)
  MUST include TypeScript types — `any` is prohibited in
  production code.

**Rationale**: Consistent quality standards prevent technical
debt accumulation and keep the codebase maintainable as the
team and feature set grow.

### II. Simplicity

The simplest solution that satisfies requirements MUST be
chosen over clever or anticipatory alternatives:

- YAGNI: Features, abstractions, and configuration options
  MUST NOT be added until a concrete requirement demands them.
- Each new abstraction (hook, utility, wrapper, service layer)
  MUST justify its existence with at least two distinct
  consumers or a measurable reduction in complexity.
- Nesting depth MUST NOT exceed 3 levels in templates/JSX and
  4 levels in logic. Deeper nesting MUST be refactored into
  composed functions or components.
- Dependencies MUST be evaluated before adoption — prefer
  built-in platform/framework APIs over third-party packages
  when capability is equivalent.
- Configuration MUST use sensible defaults. Users MUST NOT be
  forced to configure options that have one obvious correct
  value.

**Rationale**: Complexity is the primary enemy of velocity and
reliability. Every unnecessary layer adds cognitive load,
increases bug surface, and slows onboarding.

### III. User Experience Consistency

The application MUST present a unified, predictable interface
across all screens and interaction flows:

- All UI components MUST use the project's design system tokens
  (colors, spacing, typography, shadows). Hard-coded style
  values are prohibited.
- Interactive states (hover, focus, active, disabled, loading,
  error, empty) MUST be implemented for every interactive
  element — no component ships without all applicable states.
- Navigation patterns MUST be consistent: identical actions
  MUST produce identical interaction patterns regardless of
  which screen the user is on.
- Error messages MUST be user-facing, actionable, and written
  in plain language. Technical stack traces or error codes MUST
  NOT be displayed to end users.
- Layout shifts MUST be prevented: skeleton loaders or reserved
  space MUST be used for async content. Cumulative Layout Shift
  MUST remain below 0.1.
- Accessibility: all interactive elements MUST be keyboard
  navigable, MUST have sufficient color contrast (WCAG 2.1 AA),
  and MUST include appropriate ARIA attributes.

**Rationale**: Inconsistent UX erodes user trust and increases
support burden. A predictable interface reduces learning curve
and increases task completion rates.

### IV. Performance

The application MUST meet quantifiable performance thresholds
validated in CI and monitored in production:

- Initial page load (Largest Contentful Paint) MUST be under
  2.5 seconds on a 4G connection.
- Time to Interactive MUST be under 3.5 seconds on mid-tier
  mobile devices.
- Client-side route transitions MUST complete in under 300ms.
- API responses for user-initiated actions MUST return within
  500ms at the 95th percentile.
- JavaScript bundle size MUST NOT exceed the established budget.
  Any PR that increases bundle size by more than 5KB MUST
  include justification and approval.
- Images MUST use modern formats (WebP/AVIF) with responsive
  srcsets. Unoptimized assets MUST NOT be committed.
- Lists rendering more than 50 items MUST use virtualization.
- No memory leaks: components MUST clean up subscriptions,
  timers, and event listeners on unmount.

**Rationale**: Performance directly impacts user retention,
conversion, and SEO ranking. Budgets prevent gradual
degradation that is invisible in individual PRs but
catastrophic over time.

## Development Standards

- **Technology stack**: Web application (frontend + backend).
  Technology choices MUST be documented in the implementation
  plan and remain consistent across the project.
- **Branching**: Feature branches MUST be short-lived (< 5 days)
  and rebased on main before merge.
- **Commit messages**: MUST follow Conventional Commits format
  (`feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`).
- **Environment parity**: Local development, staging, and
  production MUST use identical dependency versions and
  configuration structure.

## Quality Gates

Every pull request MUST pass these gates before merge:

1. **Lint & Format**: Zero warnings from the configured linter
   and formatter.
2. **Type Check**: Zero errors from the type checker.
3. **Tests**: All existing tests pass; new behavior MUST include
   corresponding tests.
4. **Bundle Budget**: Bundle size stays within the defined
   budget or increase is justified.
5. **Accessibility Audit**: No new accessibility violations
   detected by automated tooling.
6. **Code Review**: At least one approving review from a team
   member who did not author the change.

## Governance

- This constitution supersedes all other practice documents
  when conflicts arise.
- Amendments MUST be documented with a rationale, reviewed by
  the team, and versioned using semantic versioning:
  - **MAJOR**: Principle removal or incompatible redefinition.
  - **MINOR**: New principle or material expansion of guidance.
  - **PATCH**: Clarifications, wording, or typographic fixes.
- All code reviews MUST verify compliance with these
  principles. Violations MUST be resolved before merge.
- Complexity that violates Simplicity (Principle II) MUST be
  justified in writing in the PR description with the specific
  reason and rejected simpler alternatives.

**Version**: 1.0.0 | **Ratified**: 2026-03-02 | **Last Amended**: 2026-03-02
