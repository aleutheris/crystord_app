# Roadmap — Architecture Direction

Living architecture-direction narrative for Crystord App — not an index and not a per-item record.
Kept short by design; when a direction hardens into a decision, record an ADR and link it here.

## Current shape

Crystord App is a client-side-rendered React frontend over a GraphQL backend. Key architecture
baselines (captured across `ADR-260001`–`ADR-260059` and the frozen `BI-*` epics):

- A startup **schema-compatibility handshake** (`contracts/schema-compatibility-contract.md`) that
  validates the live backend `schemaVersion` before normal API use.
- **Token-based authentication** with a verify-first sign-up, password reset, Google linking, and an
  account-settings surface.
- A **dual-view graph workspace** (Network + Flow) with shared state, force-directed layout, and
  access-level affordance gating.

## Near-term direction / pending decisions

- **Adopt backend schema 9.2.0 — `ICR-260002` (pending).** The live config pins
  `backendSchemaRange: ~9.2.0` (`public/config.json`, `deploy_config.json`; code change in commit
  `af96479`), but the move from `8.1.0` → `9.2.0` crosses the contract's "higher minor/major requires
  a new ICR" threshold and currently has no governing ICR — `ICR-260001` only authorized `8.1.0`.
  Author **`ICR-260002` (adopt schema 9.2.0)** to ratify the pin, and confirm whether `9.2.0` changes
  any operation shapes beyond the version number (review the 9.2.0 schema / commit `af96479`). Until
  then the `~9.2.0` pin in `contracts/schema-compatibility-contract.md` is
  documented-but-not-yet-ICR-ratified.
