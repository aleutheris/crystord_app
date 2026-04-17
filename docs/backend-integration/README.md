# Client Integration Pack

This folder is a portable integration bundle for client projects that consume Crystord GraphQL.

Use this pack in two phases:

1. Development phase:
- give AI agents and developers clear context about the API shape,
- generate or validate client-side GraphQL operations,
- document exactly which backend schema snapshot was adopted.

2. Runtime phase:
- validate backend compatibility at startup using the `schemaInfo` query,
- fail fast when the backend schema version is outside the client-supported range.

## Files in this pack

- `schema.graphql`: schema snapshot copied from backend.
- `client-schema-policy.json`: authoritative client-side compatibility policy and snapshot metadata.
- `approved-operations.graphql`: list of operations this client is allowed to use.

## How to use in a client project

1. Copy this entire folder into the client repository.
2. Set `supportedSchemaRange` in `client-schema-policy.json`.
3. Keep `approved-operations.graphql` in sync with real client usage.
4. On client startup, call:

```graphql
query {
  schemaInfo {
    schemaVersion
    schemaHash
    releasedAt
  }
}
```

5. Compare `schemaInfo.schemaVersion` with `supportedSchemaRange`.
6. If incompatible, block startup and show deterministic diagnostics.

## Governance guidance

- The schema file comment header is for human context.
- Runtime `schemaInfo` is the policy authority for compatibility checks.
- `schemaHash` is diagnostic integrity metadata, not compatibility policy authority.
