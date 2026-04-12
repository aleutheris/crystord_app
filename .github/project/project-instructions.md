# Frontend Project — Project Instructions

Instantiated from `.github/generic/process/project-instructions.md`.

## 1. Project Profile

- Project name: `<pending>`
- Goal: Build a new frontend project from scratch against the existing backend contract.
- Primary users: `<pending decision A2>`
- Constraints: Must honor the backend contract and domain guide while remaining independent from the current frontend implementation.

## 2. Architecture Instantiation

- Major modules and responsibilities: `<pending decision G4>`
- Module ownership map: `<pending>`
- Allowed dependency directions: `<pending>`
- Boundary contract catalog: Backend API/schema contract, internal module APIs, configuration contracts.
- Behavior-oriented slicing plan: `<pending — after MVP scope is defined>`

## 3. Interface Governance Instantiation

- Project-specific approval authority: Repository owner.
- Required approval SLA: `<pending>`
- Contract versioning strategy: Backend-facing contract pinned to an approved version; internal interfaces require explicit approval when broken.
- ICR storage location: `.github/project/evolution/adr/`

## 4. Verification Instantiation

- Critical end-to-end flows: `<pending decision I1>`
- Required boundary contracts to test: Backend contract integration, internal module boundaries.
- Integration points with highest failure risk: `<pending>`
- Component/service checks: `<after module decomposition>`
- Optional unit-test focus areas: `<pending>`

## 5. Delivery Instantiation

- Branching constraints: `<pending>`
- CI gates and blocking checks: `<pending>`
- Rollback strategy: `<pending>`
- Observability minimum: `<pending decision I3>`

## 6. Quality Gate Instantiation

- Requirement taxonomy: `FR` (functional), `QR` (quality), `OR` (operational), `CR` (constraints).
- Portability acceptance checks: `<pending>`
- Maintainability acceptance checks: File <= 200 lines, function <= 30 lines.
- Observability acceptance checks: `<pending>`
- Contract-stability checks: Backend contract compatibility validated before release.
- Readability and documentation checks: No dead code, no unused imports, meaningful naming.

## 7. Stack Addendum

- Language and runtime: `<pending>`
- Frameworks and platform: `<pending — determined after section H decisions>`
- Data/storage: `<pending>`
- Infrastructure/deployment: `<pending>`

## 8. Evolution Tracking

- Decision cadence: Per-major-decision (ADR for each checklist resolution).
- Review cadence for project instructions: After MVP scope is locked, then per-milestone.
- Requirement ID allocation: Repository owner assigns; automation welcome.
- Backlog item ownership: Repository owner.

## 9. Loading Matrix Instantiation

Always-on:
- `.github/copilot-instructions.md`
- `.github/project/project-instructions.md`

Usually referenced:
- `.github/generic/process/llm-software-execution.md`
- `.github/project/decision-checklist.md`

On-demand:
- `.github/project/evolution/requirements/*`
- `.github/project/evolution/adr/*`
- `.github/project/evolution/backlog-items/*`
- `.github/project/learnings/*`
- `docs/backend-user-guide.md`
