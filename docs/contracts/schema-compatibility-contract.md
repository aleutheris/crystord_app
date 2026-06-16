# Schema Compatibility Contract

Status: Draft
Owner: Engineering + Frontend
Last Updated: 2026-04-13

## Purpose

Define the canonical backend-to-frontend schema compatibility handshake for GraphQL consumers.

## Canonical Discovery Query

Backend exposes:

- `Query.schemaInfo`

Expected fields:

- `schemaVersion` (string, semantic version)
- `schemaHash` (string, deterministic hash of canonical schema representation)
- `releasedAt` (RFC3339 timestamp string)

## Compatibility Rules

- `schemaVersion` is authoritative for compatibility policy.
- `schemaHash` is diagnostic/integrity metadata, not policy authority.
- Frontend release must declare supported schema semver range.
- Frontend startup must query `schemaInfo` before normal API calls.

## Schema Versioning Policy

- The backend serves one live GraphQL schema per deployment, not multiple schema versions side-by-side.
- `schemaVersion` versions the public contract of that one live schema over time.
- `PATCH` version bumps are for non-breaking corrections that do not require frontend contract changes.
- `MINOR` version bumps are for backward-compatible additions such as new optional fields, queries, or mutations.
- `MAJOR` version bumps are for breaking contract changes such as removals, incompatible type changes, or newly required inputs.
- Any committed change to `crystord_server/schema.graphql` must be accompanied by a deliberate review of `schemaVersion`.
- Repository tests enforce that a changed schema file cannot keep the same recorded schema version baseline accidentally.

## Frontend Startup Validation Behavior

1. Execute `schemaInfo` query.
2. Parse `schemaVersion`.
3. Validate against frontend-supported semver range.
4. If compatible, continue normal startup.
5. If incompatible, fail fast with deterministic compatibility error state.
6. Log diagnostics including `schemaVersion`, `schemaHash`, and frontend build identifier.

## Error-Handling Contract

- Missing `schemaInfo` field is treated as incompatible backend contract.
- Invalid semver in `schemaVersion` is treated as incompatible backend contract.
- Network/authorization failures in `schemaInfo` are startup blockers with explicit diagnostics.

## Deprecation Policy Link

Deprecation and removal governance is defined by:

- `REQ-CR-260050` (Deprecation Signaling and Sunset Constraint)
- `ADR-260013` (GraphQL Schema Compatibility and Deprecation Signaling)

## Verification Artifacts

- Contract tests for `schemaInfo` field shape and required field presence.
- Integration tests for startup compatibility success/failure behavior.
- Release review checklist entry confirming deprecation path and sunset timeline for breaking changes.
