# Backend Interface Bundles

This folder is the drop point for Crystord backend interface bundles and the
home of the installer that unpacks them. It follows the same handoff mechanism
used by the `crystord_access` project.

## What a bundle is

Each release is a folder `crystord-interface-vX.Y.Z/` containing:

- `crystord-interface-vX.Y.Z.tgz` — the payload
- `verify.py` — a self-contained integrity + compatibility verifier
- `README-HANDOFF.txt` — handoff notes from the backend team

The `.tgz` contains a single top-level directory with:

- `crystord_server/schema.graphql` — backend GraphQL schema snapshot
- `docs/user-guide.md`
- `.github/project/evolution/contracts/schema-compatibility-contract.md`
- `manifest.json` — `schemaVersion`, `schemaHash`, `releasedAt`, and a per-file
  `sha256`/`sizeBytes` list

## Installing a bundle

1. Drop the new `crystord-interface-vX.Y.Z/` folder into this directory
   (`docs/backend-integration/`).
2. Run the installer from the project root:

   ```bash
   python3 tools/install_interface.py
   ```

The installer auto-discovers the **highest-versioned** bundle here, verifies it
with the bundle's own `verify.py` against a range derived from its major version
(`^MAJOR.0.0`), and extracts files into `docs/`:

- `crystord_server/schema.graphql` → `docs/crystord_server/schema.graphql`
- `docs/user-guide.md` → `docs/user-guide.md`
- `.github/.../schema-compatibility-contract.md` → `docs/contracts/schema-compatibility-contract.md`

The same newest-bundle verification runs automatically as a preflight in
`tools/run_tests.py`.

## Runtime compatibility

The installed files are development-time references. The running frontend does
**not** read them. At startup the app queries `schemaInfo` and compares the
backend's `schemaVersion` against `backendSchemaRange` from the deployed
`config.json` (see `src/config.ts`, `src/bootstrap/startup-check.ts`). When a
new bundle changes the supported major version, update `backendSchemaRange` in
`public/config.json` accordingly.

```graphql
query {
  schemaInfo {
    schemaVersion
    schemaHash
    releasedAt
  }
}
```
