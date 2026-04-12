# Software Project Instructions (Instantiation Template)

Use this file to instantiate project-specific instructions without redefining foundational policy.

## Source of Truth (Do Not Duplicate)

- Foundation policy: `.github/generic/process/framework.md`
- LLM behavior and collaboration policy: `.github/generic/process/llm-software-execution.md`
- Interface approval workflow template: `.github/generic/templates/interface-change-request.template.md`

Rule: This file must contain project instantiation details only. Do not copy policy text from the source files above.

## 1. Project Profile

- Project name: `<name>`
- Goal: `<what this software must achieve>`
- Primary users: `<roles and expectations>`
- Constraints: `<regulatory, budget, timeline, operational>`

## 2. Architecture Instantiation

- Major modules and responsibilities: `<fill>`
- Module ownership map: `<fill>`
- Allowed dependency directions: `<fill>`
- Boundary contract catalog (API/schema/events/config): `<fill>`
- Behavior-oriented slicing plan (vertical slices by capability): `<fill>`

## 3. Interface Governance Instantiation

- Project-specific approval authority: `<who approves ICRs>`
- Required approval SLA: `<time expectations>`
- Contract versioning strategy: `<semantic versioning/compatibility policy>`
- ICR storage location: `<repo path or tracking system>`

All contract changes must use `.github/generic/templates/interface-change-request.template.md`.

## 4. Verification Instantiation

- Critical end-to-end flows: `<fill>`
- Required boundary contracts to test: `<fill>`
- Integration points with highest failure risk: `<fill>`
- Component/service checks for fault localization: `<fill>`
- Optional unit-test focus areas (if needed): `<fill>`

## 5. Delivery Instantiation

- Branching constraints for this project: `<fill>`
- CI gates and blocking checks: `<fill>`
- Rollback strategy by release type: `<fill>`
- Observability minimum for release: `<fill>`

## 6. Quality Gate Instantiation

- Requirement taxonomy for this project's artifacts: `FR` (functional behavior), `QR` (quality attributes), `OR` (operational requirements), `CR` (constraints/compliance).
- Requirement taxonomy rule: encode the requirement class in the canonical record name and keep the stable class-prefixed ID in the content (`FR-*`, `QR-*`, `OR-*`, `CR-*`).
- Artifact naming rule for instantiated projects:
  - ADR files: `ADR-YYNNNN.md`
  - requirement files: `REQ-XY-YYNNNN.md` where `XY ∈ {FR, QR, OR, CR}` (for example `REQ-FR-260001.md`)
  - backlog item files: `BI-YYNNNN.md`
- Artifact-role rule:
  - ADRs and requirements are horizontal artifacts,
  - backlog items are vertical delivery slices,
  - taxonomy prefixes belong in requirement record names and content, not backlog filenames.
- Terminology rule: avoid the generic term `non-functional requirements`; use explicit designation classes.
- Portability acceptance checks: `<fill>`
- Maintainability acceptance checks: `<fill>`
- Observability acceptance checks: `<fill>`
- Contract-stability checks: `<fill>`
- Readability and documentation checks: `<fill>`

Code cohesion defaults (required unless explicitly overridden with rationale):

- File size guardrail: `<= 200 lines`.
- Function size guardrail: `<= 30 lines where practical`.

## 7. Stack Addendum

- Language and runtime: `<fill>`
- Frameworks and platform: `<fill>`
- Data/storage choices: `<fill>`
- Infrastructure/deployment model: `<fill>`

## 8. Evolution Tracking

The `.github/project/evolution/` folder tracks the lifecycle of requirements, decisions, and work items.

### Folder Structure (Bootstrap Requirements)

Every instantiated project must create and maintain the following one-file-per-item structure:

- `.github/project/evolution/adr/`
  - Holds Architecture Decision Records documenting key design decisions.
  - Naming: `ADR-YYNNNN.md` (for example `ADR-260001.md`).
  - Template: `.github/generic/templates/adr.template.md`

- `.github/project/evolution/backlog-items/`
  - Holds individual vertical backlog slice files.
  - Naming: `BI-YYNNNN.md` (for example `BI-260001.md`).
  - Backlog items may trace to multiple requirement taxonomy IDs and ADRs.
  - Template: `.github/generic/templates/backlog-item.template.md`

- `.github/project/evolution/requirements/`
  - Holds canonical requirement records, one file per requirement.
  - Naming: `REQ-XY-YYNNNN.md` where `XY ∈ {FR, QR, OR, CR}` (for example `REQ-FR-260001.md`).
  - Each requirement file carries its own change history and traceability.

- `.github/project/evolution/requirements-index.md`
  - Canonical requirement index that links all `REQ-XY-*` files and their related ADR/backlog references.

- `.github/project/evolution/product-backlog.md`
  - User-outcome-oriented backlog showing planned and in-progress work.
  - Use workflow states and prioritization rules from `.github/generic/process/product-backlog.md`.

- `.github/project/evolution/backlog-status.md`
  - Canonical backlog index/tracker that cross-references all backlog items and their workflow states.
  - Shows completion status and links to related ADRs and requirements.
  - Store item status here rather than duplicating it across overview documents.
  - Template: `.github/generic/templates/backlog-status-template.md`

### Learnings Folder (On-Demand Knowledge)

Create a separate learnings folder at project bootstrap:

- `.github/project/learnings/`
  - Stores on-demand learning records from mistakes, regressions, and repeated pitfalls.
  - Keep this folder out of always-on loading; load only when explicitly requested or when recurring issues appear.

- `.github/project/learnings/index.md`
  - Lightweight tracker of learning records with one-line summaries and links.
  - Should reference related backlog items and ADRs when relevant.
  - Template: `.github/generic/templates/learnings-index-template.md`

- `.github/project/learnings/LRN-001-short-title.md`
  - Detailed learning record for one concrete lesson.
  - Naming: `LRN-###-short-title.md` with stable incremental IDs.
  - Template: `.github/generic/templates/learning-entry-template.md`

### Project-Specific Instantiation

- Decision cadence: `<fill: how often ADRs are created (e.g., per-milestone, per-major-decision)>`
- Review cadence for project instructions: `<fill: how often to revisit section 8 guidance>`
- Requirement ID allocation: `<fill: who assigns REQ-FR-*, REQ-QR-*, REQ-OR-*, and REQ-CR-* records plus their FR/QR/OR/CR taxonomy IDs and governance rule>`
- Backlog item ownership: `<fill: who writes and maintains vertical backlog items>`

## 9. Loading Matrix Instantiation

Define which files are mandatory always-on vs conditional.

Always-on (mandatory):

- `<fill: .github/copilot-instructions.md>`
- `<fill: concise architecture policy file>`
- `<fill: concise coding quality policy file>`

Usually referenced:

- `<fill: tech stack / runtime profile>`
- `<fill: project instructions scaffold>`

On-demand:

- `<fill: requirements docs>`
- `<fill: design plans>`
- `<fill: ADRs>`
- `<fill: backlog item drafts>`
- `<fill: learnings index and detailed learning records under .github/project/learnings/>`

Budget guardrails:

- `copilot-instructions.md` <= 120 lines.
- Always-on companion files <= 120 lines each.
- On-demand files split when > ~400 lines or when ownership/review friction appears.
