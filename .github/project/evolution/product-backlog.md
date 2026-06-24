# Product Backlog

User-outcome-oriented backlog for Crystord App.

## Prioritized Items

| Priority | Backlog ID | Title | State Source | Notes |
| --- | --- | --- | --- | --- |
| 1 | BI-260001 | Formalize MVP product definition baseline | See `.github/project/evolution/backlog-status.md` | Captures accepted A1/A2 product-definition decisions with ADR/REQ traceability. |
| 2 | BI-260002 | Formalize MVP boundary and workspace surfaces | See `.github/project/evolution/backlog-status.md` | Captures accepted A4/A5/A6 decisions with FR/OR/CR traceability. |
| 3 | BI-260003 | Establish secondary-user personas and GraphQL backend contract | See `.github/project/evolution/backlog-status.md` | Captures accepted A3/B-section decisions with FR/OR/CR traceability. |
| 4 | BI-260010 | Implement B3 schema compatibility contract | See `.github/project/evolution/backlog-status.md` | Delivers `Query.schemaInfo`, startup semver handshake, and dual-channel deprecation governance. |
| 5 | BI-260011 | Formalize UX interaction and demo entry model | See `.github/project/evolution/backlog-status.md` | Captures accepted C1-C7 decisions including search bootstrap and demo sign-in entry flow. |
| 6 | BI-260012 | Formalize visualization and interaction model for MVP | See `.github/project/evolution/backlog-status.md` | Captures accepted D1-D7 decisions including graph semantics, delete safety, and performance baseline. |
| 7 | BI-260013 | Formalize search, query, and discoverability model | See `.github/project/evolution/backlog-status.md` | Captures accepted E1-E5 decisions including hybrid MVP search and Post-MVP deferral boundaries. |
| 8 | BI-260014 | Formalize information architecture baseline | See `.github/project/evolution/backlog-status.md` | Captures accepted F1-F6 decisions including shell boundaries, module ownership, and extension constraints. |
| 9 | BI-260015 | Formalize frontend architecture baseline | See `.github/project/evolution/backlog-status.md` | Captures accepted G1-G5 decisions including state partitioning, boundary rules, and contract stability governance. |
| 10 | BI-260016 | Formalize stack selection criteria and concrete MVP stack | See `.github/project/evolution/backlog-status.md` | Captures accepted H1-H9 criteria, rejection rules, runtime boundary decision, and concrete MVP stack baseline. |
| 11 | BI-260017 | Formalize delivery and quality baseline | See `.github/project/evolution/backlog-status.md` | Captures accepted I1-I6 release gates, accessibility/reliability baseline, observability operations, and fallback trust rules. |
| 12 | BI-260018 | Formalize evolution and extensibility baseline | See `.github/project/evolution/backlog-status.md` | Captures accepted J1-J5 evolution seams, growth boundaries, data-model flexibility, and migration safeguards. |
| 13 | BI-260019 | Operationalize branding governance for UI changes | See `.github/project/evolution/backlog-status.md` | Makes `.github/project/branding.md` mandatory in project instructions, review checks, and implementation decision tracking. |
| 14 | BI-260020 | Rebaseline workspace entry to blank-first explicit search | See `.github/project/evolution/backlog-status.md` | Records the decision to open the workspace blank after sign-in and populate graph content only after explicit search. |
| 15 | BI-260021 | Preserve pre-search recommended label visibility | See `.github/project/evolution/backlog-status.md` | Records the decision to keep recommended labels visible before first search to guide initial discovery. |
| 16 | BI-260022 | Add temporary capped recommendation strategy from list_labels | See `.github/project/evolution/backlog-status.md` | Records temporary source/cap behavior: use list_labels and show exactly three random recommended labels before search. |
| 17 | BI-260023 | Implement Enter-to-Search with Multi-Label Chip Input | See `.github/project/evolution/backlog-status.md` | Records search UX changes: Enter-to-search only (no keystroke filtering), Space/Colon chip creation, multi-label support, Backspace removal. |
| 18 | BI-260024 | Execute submitted searches through fresh backend queries | See `.github/project/evolution/backlog-status.md` | Records the decision that each submitted search must hit the backend GraphQL filter path and render fresh results without client-side overfetch filtering. |
| 19 | BI-260025 | Disable live search behaviors while preserving future extension seams | See `.github/project/evolution/backlog-status.md` | Records that typing must not change graph/results and autocomplete remains deferred, while dormant structure may be preserved for later use. |
| 20 | BI-260026 | Align bond mutation documents with the backend selector contract | See `.github/project/evolution/backlog-status.md` | Records the fix for the bond 400 error caused by a client-side selector type mismatch; keeps the bond dialog unchanged. |
| 21 | BI-260029 | Formalize dual-view scope and UX baseline | See `.github/project/evolution/backlog-status.md` | Records accepted dual-view scope and UX baseline with traceable ADR/REQ links before implementation work begins. |
| 22 | BI-260030 | Formalize Network view visual grammar baseline | See `.github/project/evolution/backlog-status.md` | Records accepted Network-view circle-node and connector-handle decisions before implementation planning begins. |
| 23 | BI-260031 | Formalize dual-view behavior and shared-state baseline | See `.github/project/evolution/backlog-status.md` | Records accepted shared state, cross-view selection, mutation reflection, and large-result degrade policy decisions before implementation planning begins. |
| 24 | BI-260032 | Formalize dual-view accessibility and usability baseline | See `.github/project/evolution/backlog-status.md` | Records accepted keyboard, ARIA/focus, contrast/state signaling, and legend/tooltip discoverability decisions before implementation planning begins. |
| 25 | BI-260033 | Formalize dual-view delivery and validation baseline | See `.github/project/evolution/backlog-status.md` | Records accepted coverage, performance targets, and rollout/rollback flag policy before implementation planning begins. |
| 26 | BI-260034 | Formalize geometric closest-point bond anchoring baseline | See `.github/project/evolution/backlog-status.md` | Records Topic 1 anchoring refinement baseline (geometric nearest-boundary attachment) and preserves optional/off-by-default Network-view bond-label seam for future enablement. |
| 27 | BI-260035 | Formalize directional arrowheads baseline for Network-view bonds | See `.github/project/evolution/backlog-status.md` | Records Topic 2 direction baseline (target-end arrowheads) and keeps Network-view labels optional/off-by-default while preserving future label seam. |
| 28 | BI-260036 | Formalize force-directed automatic layout baseline for Network view | See `.github/project/evolution/backlog-status.md` | Records Topic 3 layout baseline (d3-force, synchronous iteration cap, drag-position preservation, grid fallback above 400 nodes, non-determinism policy). |
| 29 | BI-260037 | Formalize outer-circumference edge initiation baseline for Network view | See `.github/project/evolution/backlog-status.md` | Records superseding ring-based initiation baseline (hover/selected ring, inner-vs-outer pointer zones, no-op blank/self drop, target-circle completion) and preserves Flow-view boundary. |
| 30 | BI-260054 | API-Contract Foundation for Schema 8.1.0 | See `.github/project/evolution/backlog-status.md` | Auth & Authz epic S1: schema range ~8.1.0, central error-code mapper, message-based session-expiry detection, new auth operation documents. |
| 31 | BI-260055 | Verify-First Sign-Up Flow | See `.github/project/evolution/backlog-status.md` | Auth & Authz epic S1: restores registration via beginSignup/completeSignup + emailed-code screen with shared validation. |
| 32 | BI-260056 | Session-Aware Auth State and Server-Side Logout | See `.github/project/evolution/backlog-status.md` | Auth & Authz epic S1: session token handling, server logout, demo/URL tokens as sessions, google-not-linked + rate-limit UX. |
| 33 | BI-260057 | Self-Service Password Reset | See `.github/project/evolution/backlog-status.md` | Auth & Authz epic S1: forgot/reset password for locked-out users; reset revokes sessions → sign-in. |
| 34 | BI-260058 | Account-Settings Surface and Identity Overview | See `.github/project/evolution/backlog-status.md` | Auth & Authz epic S2: new account-settings module replacing AdminPlaceholder; me identity overview. |
| 35 | BI-260059 | Auth-Method Management (Password, Unlink, Link Google) | See `.github/project/evolution/backlog-status.md` | Auth & Authz epic S2: setPassword, unlink, link Google (closes the AUTH-GOOGLE-NOT-LINKED recovery loop). |
| 36 | BI-260060 | Email Change, Sign-Out-Everywhere, and Delete Account | See `.github/project/evolution/backlog-status.md` | Auth & Authz epic S2: email change, revokeAllSessions, account deletion with block reasons. |
| 37 | BI-260061 | Read-Side Access-Level Affordance Gating | See `.github/project/evolution/backlog-status.md` | Auth & Authz epic S3: gate edit/delete/bond affordances on AtomOutput.accessLevel. |
| 38 | BI-260062 | Align Label-Listing Read with Schema 8.1.0 Operation Name | See `.github/project/evolution/backlog-status.md` | 8.1.0 baseline compatibility: list_labels → listLabels rename in LIST_LABELS_QUERY + consumers. Done. |

## Workflow States

- **Idea** → **Refined** → **Ready** → **In Progress** → **Done** → **Observed**

## Execution Policy (Ported)

- Delivery model: direct-to-main with small, reversible slices.
- Execution model: one backlog slice per run.
- Pre-start gate:
	- target item status is Ready and traceable to ADR/REQ artifacts
	- selected quality checks are explicit for the slice
- Default quality checks per implementation slice:
	- `npm run lint`
	- `npm run typecheck`
	- `npm run test`
	- `npm run test:e2e` when critical flows are affected
- Slice completion evidence:
	- changed files
	- test evidence (commands + pass/fail)
	- residual risks and follow-up actions
- Canonical policy note:
	- Stable delivery/quality policy is defined in `.github/project/project-instructions.md` and backlog item templates.
	- Backlog order/priority is maintained in this file; item state is maintained in `.github/project/evolution/backlog-status.md`.
