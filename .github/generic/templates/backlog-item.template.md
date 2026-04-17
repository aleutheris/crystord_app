# Backlog Item Template

Use this template for value-focused backlog entries.

Status is tracked in the project's backlog status index file, not in backlog item files.

- Backlog Item ID: `<BI-YYNNNN>`
- Title: `<short value-oriented title>`
- Persona/Actor: `<who benefits>`
- Value statement: `For <persona>, deliver <capability> to achieve <outcome>.`
- Context: `<where and when this problem happens>`
- Problem statement: `<what pain/risk exists now>`
- Expected outcome: `<observable user/business outcome>`
- Success metric(s): `<how success is measured>`
- Acceptance criteria (behavior):
  - `<criterion 1>`
  - `<criterion 2>`
- Non-goals: `<what is explicitly out of scope>`
- Constraints: `<legal, operational, technical, timeline>`
- Dependencies: `<other backlog items, systems, approvals>`
- Risks/assumptions: `<key risks or unknowns>`
- Validation approach: `<e2e behavior checks, contract checks, telemetry>`
- Implementation scope (when item moves to In Progress):
  - In-scope modules/files: `<paths or areas>`
  - Out-of-scope guardrails: `<areas explicitly excluded>`
- Evidence requirements for Done:
  - Requirement-to-evidence mapping: `<REQ -> test/check/manual note>`
  - Quality gates: `<lint/typecheck/test/test:e2e as applicable>`
  - Regression checks: `<critical flows and result>`
  - Risk and rollback notes: `<residual risk + rollback path>`
- Priority score: `<numeric value>`
- Target window: `<sprint/release>`
- Links:
  - Requirement entry: `<REQ-FR-YYNNNN.md | REQ-QR-YYNNNN.md | REQ-OR-YYNNNN.md | REQ-CR-YYNNNN.md | n/a>`
  - ADR: `<adr reference or n/a>`
  - ICR: `<icr reference or n/a>`
  - Changeset: `<reference or n/a>`

## Done Evidence Block (fill at completion)

- Scope lock:
  - In scope:
  - Out of scope:
  - Deferrals:
- Requirement mapping:
  - REQ-... -> evidence
  - REQ-... -> evidence
- Commands:
  - `npm run lint` -> exit code
  - `npm run typecheck` -> exit code
  - `npm run test` -> exit code
  - `npm run test:e2e` -> exit code / N/A reason
- Regression checks:
  - Flow -> result
- Changed files reviewed:
  - Intended:
  - Incidental (if any):
- Risks and follow-ups:
  - Residual risk:
  - Follow-up action:
- Rollback path:
  - Step(s):
