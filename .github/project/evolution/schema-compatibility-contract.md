# Schema Compatibility Contract

## Purpose

Defines the canonical frontend-backend compatibility handshake for GraphQL schema evolution.

## Canonical Source

- GraphQL query field: `Query.schemaInfo`
- Authoritative fields:
  - `schemaVersion` (semver string)
  - `schemaHash` (diagnostic hash)
  - `releasedAt` (RFC3339 timestamp)

## Frontend Handshake

1. Query `schemaInfo` once at startup before normal API usage.
2. Compare `schemaVersion` to configured supported semver range.
3. If incompatible, stop normal API flow and show explicit compatibility error.

Example policy:
- Supported range: `^2.0.0`
- Behavior on mismatch: fail fast, block graph workspace operations, present recovery guidance.

## Compatibility Policy

- Backward-compatible changes are default.
- Breaking changes require explicit approval through ICR workflow.
- Deprecations remain compatible for at least one release cycle after announcement.

## Diagnostics

- `schemaHash` supports troubleshooting and release diff confirmation.
- GraphQL introspection is diagnostic-only for this policy.

## References

- ADR-260013
- REQ-OR-260002
- BI-260010
