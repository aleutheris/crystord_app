# Implementation Execution Runbook

This file is the durable execution guide for staged implementation runs.

## Scope

- Delivery model: direct-to-main with lightweight, non-blocking quality checks.
- Execution model: one backlog slice per run.
- Applies to the first Ready implementation sequence and can be extended for later slices.

## Approved Sequence

1. BI-260010: Schema compatibility handshake
2. BI-260011: Demo entry and workspace shell behavior
3. BI-260012: Graph interaction primitives and delete safety
4. BI-260013: Search/query/discoverability behavior

## Per-Slice Change Boundaries

### BI-260010

Allowed:
- `docs/backend-integration/*`
- frontend API contract/bootstrap files (for example `src/api-contract/**`, `src/app/bootstrap/**`)
- configuration/scripts needed for compatibility check wiring

Out of scope:
- graph UI behavior
- non-compatibility UX redesign

### BI-260011

Allowed:
- entry/auth shell and route guard areas (for example `src/features/auth-entry/**`, `src/ui-shell/**`)

Out of scope:
- advanced graph manipulation logic beyond shell/entry integration

### BI-260012

Allowed:
- graph interaction and detail-edit modules (for example `src/features/workspace-graph/**`, `src/features/workspace-details/**`)
- related test files

Out of scope:
- search semantics beyond graph interaction needs

### BI-260013

Allowed:
- search/discoverability modules (for example `src/features/workspace-search/**`)
- graph re-scope integration points

Out of scope:
- Post-MVP advanced query-builder/autocomplete capabilities

## Default Test Contract

Default commands per slice:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e` (when slice touches critical flows)

Pass criteria:
- all selected commands exit with code 0
- no unresolved errors in touched files
- acceptance behavior demonstrated with test evidence or explicit manual verification notes

## Per-Slice Definition of Done

### BI-260010 DoD

- startup `schemaInfo` compatibility check is implemented and enforced
- incompatible schema blocks normal flow with explicit diagnostics
- tests: `lint`, `typecheck`, `test`

### BI-260011 DoD

- demo sign-in gate works for development/testing
- authenticated entry reaches workspace shell reliably
- tests: `lint`, `typecheck`, `test`, `test:e2e`

### BI-260012 DoD

- required graph primitives work (select, drag, connect, pan/zoom, delete safety)
- delete confirm/undo behavior is validated
- tests: `lint`, `typecheck`, `test`, `test:e2e`

### BI-260013 DoD

- MVP search controls work and re-scope graph/results as specified
- deferred search features remain out of scope
- tests: `lint`, `typecheck`, `test`, `test:e2e`

## Slice Completion Report Requirements

Each run must report:
- changed files
- test evidence (commands + pass/fail)
- residual risks or follow-up actions

## Go Gate Before Starting a Slice

- target backlog item status is Ready and fully traceable
- selected quality checks are explicit for this slice (`lint`, `typecheck`, `test`, and when applicable `test:e2e`)
- required tests and acceptance criteria are explicitly included in the run prompt
