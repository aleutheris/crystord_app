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

- `provided-schema.graphql`: schema snapshot copied from backend.
- `client-schema-policy.json`: authoritative client-side compatibility policy and snapshot metadata.
- `allowed-schema.graphql`: list of operations this client is allowed to use.

## How to use in a client project

1. Copy this entire folder into the client repository.
2. Set `supportedSchemaRange` in `client-schema-policy.json`.
3. Keep `allowed-schema.graphql` in sync with real client usage.
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

## Updating the Interface

When a new backend interface is released:

1. Copy the `crystord-interface-vX.Y.Z` folder into `docs/backend-integration/`
2. Run the update orchestration:
   ```bash
  python3 docs/backend-integration/update-interface.py docs/backend-integration/crystord-interface-vX.Y.Z
   ```
3. Review the diff report and verify no breaking changes
4. Run tests to confirm compatibility:
   ```bash
   npm run test
  python3 run_tests.py --all
   ```
5. Commit the updated integration files
6. The orchestration script will clean up the source folder and log the changes

### Process properties
- **Deterministic**: same input always produces same output
- **Reversible**: git diff shows exactly what changed; easy to revert
- **Auditable**: script logs every decision and file modification
- **Automatable**: can be integrated into CI/CD workflows
