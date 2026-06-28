# Contract: `schema-compatibility-contract` — Frontend/Backend GraphQL Schema Compatibility

A boundary contract — the standing agreement at the GraphQL schema interface between the backend
and this frontend. Changes to it require an ICR (`framework.md` §3). Status values: see
`docs/governance/generic/process/artifact-model.md`.

- Contract file: `schema-compatibility-contract.md`
- Status: Active
- Type: database schema (GraphQL schema contract)
- Owner: Engineering + Frontend

## Interface Governed

The GraphQL schema served by the backend, discovered at runtime via `Query.schemaInfo`. The
contract governs how the frontend validates compatibility with the live backend schema before
normal API use.

## Provider and Consumers

- Provider: backend GraphQL service (`crystord_server`, `schema.graphql`).
- Consumers: this frontend (`crystord_app`) — startup compatibility handshake and all API operations.

## Contract Definition

### Canonical discovery query

- `Query.schemaInfo`. Authoritative fields:
  - `schemaVersion` (semver string) — authoritative for compatibility policy.
  - `schemaHash` (deterministic hash) — diagnostic/integrity metadata, not policy authority.
  - `releasedAt` (RFC3339 timestamp).

### Frontend startup handshake

1. Execute the `schemaInfo` query once at startup, before normal API usage.
2. Parse `schemaVersion` and validate it against the frontend-supported semver range.
3. If compatible, continue normal startup.
4. If incompatible, fail fast with a deterministic compatibility error state: block graph
   workspace operations and present recovery guidance.
5. Log diagnostics including `schemaVersion`, `schemaHash`, and the frontend build identifier.

### Error handling

- A missing `schemaInfo` field is treated as an incompatible backend contract.
- Invalid semver in `schemaVersion` is treated as an incompatible backend contract.
- Network/authorization failures in `schemaInfo` are startup blockers with explicit diagnostics.

## Compatibility and Versioning

- The backend serves one live GraphQL schema per deployment, not multiple schema versions
  side-by-side. `schemaVersion` versions the public contract of that one live schema over time.
- `PATCH`: non-breaking corrections that do not require frontend contract changes.
- `MINOR`: backward-compatible additions (new optional fields, queries, or mutations).
- `MAJOR`: breaking contract changes (removals, incompatible type changes, newly required inputs).
- Backward-compatible changes are the default; breaking changes require explicit approval through
  the ICR workflow. Deprecations remain compatible for at least one release cycle after
  announcement (tracked in `deprecation-log.md`).
- Any committed change to `crystord_server/schema.graphql` must be accompanied by a deliberate
  review of `schemaVersion`. Repository tests enforce that a changed schema cannot silently keep
  the same recorded baseline version.

### Current pinned range

- `public/config.json` / `deploy_config.json` `backendSchemaRange`: **`~9.2.0`** — auto-adopt
  `9.2.x` patches; a higher minor or major requires a new ICR.

> **Outstanding ICR (governance gap).** `ICR-260001` authorized the move to `8.1.0`. The live
> configuration has since advanced to `~9.2.0` (code change in commit `af96479`), which crosses the
> "higher minor/major requires a new ICR" threshold above. The successor **`ICR-260002` (adopt
> schema 9.2.0)** is not yet recorded — see `roadmap.md`. Until it lands, this `~9.2.0` pin is
> documented-but-not-yet-ICR-ratified, and whether 9.2.0 changes any operation shapes beyond the
> version pin still needs confirmation.

## Verification

- Contract/integration tests for `schemaInfo` field shape and required-field presence.
- Integration tests for startup compatibility success/failure behavior.
- Release-review checklist entry confirming the deprecation path and sunset timeline for breaking changes.

## Traceability

- Related requirements: REQ-OR-260002, REQ-OR-260016, REQ-OR-260017.
- Related ADRs: ADR-260013 (schema compatibility & deprecation governance), ADR-260054 (adopt schema 8.1.0).
- Change requests (ICRs): ICR-260001 (adopt 8.1.0, Implemented); ICR-260002 (adopt 9.2.0) — pending.
- Related epics (frozen): BI-260010, BI-260054.
- Companion record: `deprecation-log.md`.
