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

- **Backend schema 9.2.0 adoption — resolved.** Ratified by `ICR-260002` (approved 2026-06-29); the
  `~9.2.0` pin in `contracts/schema-compatibility-contract.md` is now fully ICR-backed (shipped in
  commit `af96479`). The 8.1.0 → 9.2.0 delta was additive-only (new `Category*` taxonomy ops/fields)
  and outside this frontend's used surface. No open schema decision remains.
