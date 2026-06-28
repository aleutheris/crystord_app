# ICR Index

Append-only audit log of interface change requests (ICRs) for Crystord App. `Open` requests are
listed first. Status values per `docs/governance/generic/process/artifact-model.md`. ICRs are
never moved or deleted; an approved ICR's effect lands in the contract it modifies.

| ID | Title | Status | Record | Related | Notes |
| --- | --- | --- | --- | --- | --- |
| ICR-260001 | Adopt backend schema 8.1.0 (`backendSchemaRange ~8.1.0`) | Implemented | [ICR-260001.md](icr/ICR-260001.md) | schema-compatibility-contract, ADR-260054, REQ-OR-260016, REQ-OR-260017 | Status asserted `Implemented` (the record carries no `Status:` field): 8.1.0 was adopted and shipped. |

> Pending: `ICR-260002` (adopt schema 9.2.0) is required to ratify the live `~9.2.0` pin but is not
> yet authored — tracked in `roadmap.md`. Add its row here when created.

## Tracking Rules

1. Keep this index synchronized with the `icr/` folder contents.
2. Update status as ICRs progress: `Open → Approved → Implemented`; `Rejected` / `Withdrawn` are terminal.
3. Never delete a row; ICRs are an append-only audit log.
4. Load on-demand when proposing or reviewing a contract change.
