# Frontend Project — Project Instructions

Instantiated from `.github/generic/process/project-instructions.md`.

## 1. Project Profile

- Project name: `Crystord Web`
- Goal: Build a new frontend project from scratch against the existing backend contract.
- Primary users: Data managers and domain operators who require transparent data and relationship visibility.
- Constraints: Must honor the backend contract and domain guide while remaining independent from the current frontend implementation, and must apply branding policy defined in `.github/project/branding.md` for all UI/design-facing changes.

## 2. Architecture Instantiation

- Major modules and responsibilities: `auth-entry` (demo sign-in and entry guard), `workspace-graph` (canvas interactions and graph rendering), `workspace-search` (bootstrap and label-driven scoping), `workspace-details` (side-panel edit flows), `api-contract` (GraphQL bindings/adapters/compatibility checks), `ui-shell` (routing/layout/navigation shell), `ui-primitives` (shared template library — typed prop contracts and barrel exports for reusable UI primitives).
- Module ownership map: Repository owner owns all modules in MVP; ownership split can be introduced Post-MVP by module boundary.
- Allowed dependency directions: `ui-shell` composes feature modules; feature modules may depend on `ui-primitives`, shared utilities, and `api-contract`; feature modules must not import other feature internals; `ui-primitives` must not import from any feature module.
- Boundary contract catalog: Backend API/schema contract, internal module APIs, configuration contracts, `ui-primitives` prop contracts.
- Behavior-oriented slicing plan: Vertical slices by capability: entry/auth, graph interaction, search/discovery, details editing, API-contract integration. Within each feature slice, `use-*.ts` hooks own behavior and components own presentation — established practice in `workspace-graph`, standard for all new slices.
- UI Primitives template library: `src/ui-primitives/` hosts typed prop contracts for buttons, inputs, selection controls, feedback, layout, and typography. Path alias `@ui/*` resolves to this directory. New templates are added per the `CATALOG.md` convention guide (ADR-260051).

## 3. Interface Governance Instantiation

- Project-specific approval authority: Repository owner.
- Required approval SLA: Target response within 48 hours for ICR decisions.
- Contract versioning strategy: Backend-facing contract pinned to an approved version; internal interfaces require explicit approval when broken.
- ICR storage location: `.github/project/evolution/adr/`

## 4. Verification Instantiation

- Critical end-to-end flows: Demo sign-in entry, bootstrap search graph load, atom create/edit persistence, bond create/name persistence, delete safety behavior (confirm/undo), and error-path resilience without app crash.
- Required boundary contracts to test: Backend contract integration, internal module boundaries.
- Integration points with highest failure risk: `schemaInfo` startup compatibility handshake, mutation persistence and adapter mapping, route guard/auth entry behavior, graph interaction state synchronization.
- Component/service checks: api-contract adapters and schema policy checks, graph canvas action handlers, search-to-graph scoping integration, detail panel mutation orchestration.
- Optional unit-test focus areas: Adapter mappers, validation logic, and pure state transitions with non-trivial branching.
- Branding compliance checks: UI copy, color semantics, and interaction states align with `.github/project/branding.md`.

## 5. Delivery Instantiation

- Branching constraints: Direct-to-main workflow with small, reversible commits.
- CI gates and blocking checks: ESLint, strict TypeScript type checks, Vitest suite, contract/integration checks for backend compatibility boundaries, and smoke-level E2E checks for critical flows.
- Rollback strategy: Redeploy last-known-good artifact, run immediate smoke verification, and preserve diagnostics from failed release attempt.
- Observability minimum: Structured client logs, contextual error events (route/action/API), and baseline metrics for workspace load, bootstrap search latency, mutation outcomes, schema-compatibility failures, and demo sign-in failures.
- Commit behavior guidance: commit to `main` whenever needed; for higher-risk changes, run selected quality checks before commit.

## 6. Quality Gate Instantiation

- Requirement taxonomy: `FR` (functional), `QR` (quality), `OR` (operational), `CR` (constraints).
- Portability acceptance checks: MVP runs in modern desktop browsers and uses environment-driven backend endpoint/configuration without hardcoded environment values.
- Maintainability acceptance checks: File <= 200 lines, function <= 30 lines.
- Observability acceptance checks: Required logs/events/metrics are emitted for critical flows and compatibility/auth failures with actionable diagnostic context.
- Contract-stability checks: Backend contract compatibility validated before release.
- Readability and documentation checks: No dead code, no unused imports, meaningful naming.
- Branding acceptance checks: UI and design changes map to brand tokens/semantics and do not violate branding constraints in `.github/project/branding.md`.

## 7. Stack Addendum

- Language and runtime: TypeScript with browser CSR runtime; Node.js LTS toolchain for build/test workflows.
- Frameworks and platform: React, React Router, Apollo Client, React Flow (or equivalent editor-grade graph library), React Hook Form with schema validation, and utility/headless UI primitives.
- Data/storage: GraphQL backend via Apollo client/cache plus lightweight local workspace state store; no client-side persistent database in MVP.
- Infrastructure/deployment: Single frontend application artifact with environment-based configuration and versioned deploy/rollback process.

## 8. Evolution Tracking

- Decision cadence: Per-major-decision (ADR for each checklist resolution).
- Review cadence for project instructions: After MVP scope is locked, then per-milestone.
- Requirement ID allocation: Repository owner assigns; automation welcome.
- Backlog item ownership: Repository owner.

## 9. Loading Matrix Instantiation

Always-on:
- `.github/copilot-instructions.md`
- `.github/project/project-instructions.md`
- `.github/project/branding.md`

Usually referenced:
- `.github/generic/process/llm-software-execution.md`
- `.github/project/evolution/requirements-index.md`
- `.github/project/evolution/backlog-status.md`
- `.github/project/evolution/adr-index.md`

On-demand:
- `.github/project/evolution/requirements/*`
- `.github/project/evolution/adr/*`
- `.github/project/evolution/backlog-items/*`
- `.github/project/learnings/*`
- `docs/backend-user-guide.md`
