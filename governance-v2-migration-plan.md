# Governance Migration Plan — v1.0.0 → v2.0.0 (revised: plan v2)

> Status: **EXECUTED** — all 5 phases applied; lint, typecheck, 927 unit tests, and build all green;
> `.github/workflows/deploy.yml` unchanged. Changes are staged (via `git mv`/`git rm`) but **not
> committed** — committing/pushing is left to the repo owner.
> Source: the `projecter` repo (`projecter/docs/governance/`), version **v2.0.0 — "Tool-neutral
> governance + epic model"** (see `projecter/docs/governance/CHANGELOG.md`).
> Target: this repo (`crystord_app`), migrated from governance **v1.0.0** (`.github/`) to **v2.0.0**
> (`docs/governance/`).
>
> **One deviation from the plan (with reason):** the duplicate-contract deletion in decision #5 was
> reverted. `docs/contracts/schema-compatibility-contract.md` turned out to be **tool-generated** by
> `tools/install_interface.py` (it extracts the backend interface bundle's `.github/`-namespaced
> contract into `docs/contracts/`), not a hand-authored duplicate. It was **restored**, the
> backend-integration README (which documents that installer behavior) was **left untouched**, and
> the governance contract record now coexists as our governance view. The pin-bump to `~9.2.0` and
> the `ICR-260002` follow-up flag were applied as planned to the governance record + `roadmap.md`.
>
> This is plan **v2**: it corrects eight defects found in review of plan v1. The strategy is
> unchanged (freeze BI history, adopt the epic model forward); only the execution was made precise.

---

## 0. Confirmed decisions

1. **BI freeze, adopt forward.** The **59** `BI-*.md` records (IDs `01,02,03` then `10–65`;
   `04–09` never existed) are Done history. They keep their `BI-` filenames and IDs (frozen).
   New work uses `EPIC-YYNNNN`. No bulk rename.
2. **`projecter/` is deleted by the user** AFTER migration. Phase 1's copy MUST run while
   `projecter/` still exists. Nothing else is needed from it.
3. **`user-friendliness-ideas.md`** — kept, continued inside the governance tree only.
4. **`deprecation-log.md`** — **kept** (it is a live, referenced backend-API deprecation tracker,
   not an archival index), **re-homed next to the contract it serves**: `evolution/contracts/`.
5. **Contract record reconciliation** — the newer `.github` copy (schema **8.1.0**) is
   authoritative; merge any still-useful sections from the older `docs/contracts/` draft, then
   **delete the `docs/contracts/` copy** and repoint `docs/backend-integration/README.md`.
6. **Generic-instructions change consented.**

---

## Guiding principles (the "don't break anything" guarantees)

1. **One branch, `git mv` everywhere** — preserves history; nothing retyped that can be moved.
2. **Verbatim moves wherever possible.** Only **three** files have their *content* rewritten:
   `project-instructions.md` (re-instantiated), `epic-index.md` (regenerated from
   `backlog-status.md`), and the contract record (merged). Everything else is `git mv` + path-string
   updates. branding.md, the 43 ADRs, the ICR, 112 requirements, and the 59 BIs all move **verbatim**,
   so their content-level test assertions stay green with only path edits.
3. **Freeze history literally** — `BI-*.md` keep filenames and IDs. Avoids rewriting 200+
   cross-references across requirements, ADRs, and the architecture test.
4. **Each commit is internally test-consistent.** The `architecture.test.ts` edits travel in the
   **same commit/phase as the move that would break them** (see Phase 2 and Phase 3). There is no
   window where the suite is red at a phase boundary.
5. **`.github/workflows/` untouched** — verified zero governance references; GitHub Actions keeps working.
6. **Do not merge or deploy mid-migration.** Intermediate commits have dangling governance links by
   design; only the final branch state is internally consistent. Work the branch to completion, then merge.

---

## Inventory (verified counts)

- `backlog-items/`: **59** files (→ frozen epics).
- `adr/`: **44** files = **43 ADRs + 1 ICR** (`ICR-260001.md` currently misfiled under `adr/`).
- `requirements/`: **112** files.
- `learnings/`: **1** file (`LRN-001`).
- Contract record exists in **two** divergent places: `.github/project/evolution/` (newer, 8.1.0)
  and `docs/contracts/` (older Draft).
- Code coupling to governance paths: **only** `src/architecture.test.ts` (8 path reads + 1 title string).

---

## Target tree (after migration)

```
docs/governance/
  README.md                       # copied from projecter (the router)
  CHANGELOG.md                    # copied from projecter (records we're on v2.0.0)
  generic/                        # wholesale copy from projecter (replaces .github/generic)
    process/{framework, framework-reference, artifact-model, epic-process, project-instructions}.md
    templates/{adr, contract, epic, index, interface-change-request, learning, requirement}.template.md
  project/
    project-instructions.md       # re-instantiated; stamped "v2.0.0"; preserves test literals
    branding.md                   # git mv (verbatim)
    evolution/
      adr/ + adr-index.md                       # git mv (43 ADRs; index name already v2-correct)
      requirements/ + requirement-index.md      # git mv; index file renamed (singular). Header stays "Related BIs"
      contracts/ + contract-index.md            # NEW folder
        schema-compatibility-contract.md        # newer .github copy (merged), canonical
        deprecation-log.md                      # git mv here (companion to the contract)
      icr/ + icr-index.md                       # NEW folder; ICR-260001.md relocated in, index seeded
      epics/ + epic-index.md                    # backlog-items/ -> epics/ (59 BI files frozen); epic-index regenerated
      roadmap.md                                # NEW (short architecture-direction stub)
      user-friendliness-ideas.md                # git mv (project extra, kept in governance)
    learnings/ + learning-index.md              # git mv OUT of evolution/; index file renamed (singular)
CLAUDE.md                         # rewritten to thin pointer + @-imports
.github/copilot-instructions.md   # rewritten to thin pointer
.github/workflows/deploy.yml      # UNCHANGED
(deleted) docs/contracts/         # older divergent contract copy removed after merge
```

---

## Phase 1 — Generic tier  *(must run BEFORE projecter is deleted)*

Edits `generic instructions` — consented.

- `cp -r projecter/docs/governance/{generic,README.md,CHANGELOG.md}` -> `docs/governance/`.
- Rewrite root **`CLAUDE.md`** to projecter's thin-pointer model: short pointer plus
  `@docs/governance/README.md` and `@docs/governance/generic/process/framework.md` imports.
- Rewrite **`.github/copilot-instructions.md`** to projecter's thin-pointer model.
- `git rm -r .github/generic/`.

**Successor note (review #8, verified):** `llm-software-execution.md` is removed but its substance
survives in `framework.md` §2 (Operating Values and Collaboration), §4 (Design/Quality Heuristics),
§5 (Verification/Delivery), §6 (Acceptance Gates) plus `framework-reference.md`. The old loading
trigger ("for design/architecture/risk/tradeoff tasks, load llm-software-execution.md") is repointed
to `framework.md` (now always-on) + `framework-reference.md` by the thin-pointer rewrite.

**Net removals:** `llm-software-execution.md`, `product-backlog.md`, and templates `backlog-item`,
`backlog-status-template`, `requirements-log-template`, `learnings-index-template` — all superseded by
`framework.md §2`, `epic-process.md`, `epic.template.md`, and `index.template.md` in the copied tree.

**No test touches generic files**, so the suite is green at this phase boundary on its own.

**Checkpoint:** `npm run lint && npm run typecheck && npm test` green.

---

## Phase 2 — Project records + their test edits (one consistent commit)

### Moves (verbatim `git mv` unless noted)

| From | To | Note |
|---|---|---|
| `.github/project/branding.md` | `docs/governance/project/branding.md` | verbatim |
| `.github/project/evolution/adr/ADR-*.md` | `docs/governance/project/evolution/adr/` | verbatim (43 files) |
| `.github/project/evolution/adr-index.md` | same relative path | name already v2-correct |
| `.github/project/evolution/adr/ICR-260001.md` | `docs/governance/project/evolution/icr/ICR-260001.md` | **relocate** (was misfiled under adr/) |
| `.github/project/evolution/requirements/` | `docs/governance/project/evolution/requirements/` | verbatim (112 files) |
| `requirements-index.md` | `requirement-index.md` | rename file; **header stays `Related BIs`** |
| `learnings/` + `learnings-index.md` | `docs/governance/project/learnings/` + `learning-index.md` | move out of evolution/; rename index |
| `.github/project/evolution/schema-compatibility-contract.md` | `evolution/contracts/schema-compatibility-contract.md` | base for merge (see below) |
| `.github/project/evolution/deprecation-log.md` | `evolution/contracts/deprecation-log.md` | companion to the contract |
| `.github/project/evolution/user-friendliness-ideas.md` | `evolution/user-friendliness-ideas.md` | project extra |
| `.github/project/evolution/product-backlog.md` | — | `git rm` (priority folds into `epic-index.md`) |

### New files this phase
- `evolution/icr/icr-index.md` — seeded with `ICR-260001` (status **Implemented** — the 8.1.0 adoption).
- `evolution/contracts/contract-index.md` — one row: `schema-compatibility-contract`, status **Active**.
- `evolution/roadmap.md` — short architecture-direction narrative seeded from existing ADRs.

### Contract merge (decision #5)
Use the newer `.github` copy as base; fold in still-valid richer sections from the `docs/contracts/`
draft (versioning policy, error-handling contract, verification artifacts) that don't contradict the
8.1.0 truth. Then `git rm docs/contracts/schema-compatibility-contract.md` (and the now-empty dir).

### project-instructions.md re-instantiation (highest-care step)
Re-instantiate against `generic/process/project-instructions.md`: same project facts, new structure,
**Governance version: `v2.0.0`** in §1, §9 loading matrix updated to the new paths. It MUST preserve
the literals/patterns the architecture test asserts:
- `branding.md` present (multiple) — [:983](src/architecture.test.ts#L983)
- a sentence where **constraint ↔ brand co-occur** — [:984](src/architecture.test.ts#L984) `/[Cc]onstraint.*brand|brand.*[Cc]onstraint/s`
- a **"branding check / accept"** phrase — [:988](src/architecture.test.ts#L988)
- the literal **`brand tokens`** — [:989](src/architecture.test.ts#L989)
- `branding.md` inside the **always-on** block — [:994](src/architecture.test.ts#L994)

### architecture.test.ts edits — **in this same commit** (8 path edits + 1 title + 1 regex)
- [:954](src/architecture.test.ts#L954) title string `.github/project/branding.md` → `docs/governance/project/branding.md`
- [:956](src/architecture.test.ts#L956), [:1080](src/architecture.test.ts#L1080) branding.md path
- [:962](src/architecture.test.ts#L962), [:1003](src/architecture.test.ts#L1003) `adr/ADR-260022.md` path
- [:968](src/architecture.test.ts#L968), [:1010](src/architecture.test.ts#L1010) `requirements/REQ-CR-260011.md` path
- [:978](src/architecture.test.ts#L978) `project-instructions.md` path
- [:994](src/architecture.test.ts#L994) **regex widened** `/Always-on:/` → `/Always-on[^:]*:/` so the new
  template's actual label `Always-on (mandatory):` still matches. (Deliberate, documented; the test is a
  co-migrated artifact. The lookahead `(?=Usually|$)` already matches the template's `Usually referenced:`.)

> Note: the BI-260019 path edit ([:1018](src/architecture.test.ts#L1018)) is **deferred to Phase 3**,
> because the BI move happens in Phase 3. Until then BI-260019 still resolves at its old path, so this
> commit stays green.

**Checkpoint:** suite green.

---

## Phase 3 — Backlog → epics (freeze) + its test edit (one consistent commit)

- `git mv .github/project/evolution/backlog-items/` -> `docs/governance/project/evolution/epics/`
  (59 BI filenames unchanged).
- Regenerate `backlog-status.md` -> **`epic-index.md`** from `index.template.md`: same **59** rows,
  add **Priority** column (all Done → priority historical/`—`), header note: *"`BI-*` are frozen legacy
  planning records from governance v1; new epics use `EPIC-YYNNNN`."* (Regenerated, **not** swept.)
- `git rm .github/project/evolution/backlog-status.md`.
- **architecture.test.ts** [:1018](src/architecture.test.ts#L1018) `backlog-items/BI-260019.md` →
  `epics/BI-260019.md` — **in this commit**.

**Checkpoint:** suite green.

---

## Phase 4 — Doc-only reference fixups (no test impact)

- `docs/backend-integration/README.md` (L19, L39) → point at the canonical contract location
  `docs/governance/project/evolution/contracts/schema-compatibility-contract.md`.
- **Link-target fixup via an explicit rename map** (not a prefix-only sweep), applied to links *into*
  the renamed paths from other governance files:
  ```
  .github/project/evolution/backlog-items/   → docs/governance/project/evolution/epics/
  .github/project/evolution/requirements-index.md → .../requirement-index.md
  .github/project/evolution/learnings-index.md    → .../learnings/  (now under project/learnings/) + learning-index.md
  .github/project/evolution/schema-compatibility-contract.md → .../contracts/schema-compatibility-contract.md
  .github/project/evolution/deprecation-log.md → .../contracts/deprecation-log.md
  ICR-260001 references to adr/ICR-260001.md   → icr/ICR-260001.md
  .github/project/  → docs/governance/project/   (fallback prefix, applied LAST)
  .github/generic/  → docs/governance/generic/   (fallback prefix, applied LAST)
  ```
  Dangling links to the deleted `product-backlog.md` / `backlog-status.md` get repointed to
  `epic-index.md` or noted inline. `epic-index.md` itself is regenerated (Phase 3), not swept.

**Checkpoint:** suite green.

---

## Phase 5 — Verify

```
npm run lint          # eslint . — markdown not linted; no impact expected
npm run typecheck     # tsc -b --noEmit
npm test              # vitest — architecture.test.ts must be green
npm run build         # confirm app build unaffected (governance not imported by app code)
```
Plus: confirm `.github/workflows/deploy.yml` is unchanged in the diff; confirm Claude loads the new
always-on core from the rewritten `CLAUDE.md`. **(User action)** delete `projecter/` — only after Phase 1.

---

## Out of scope (deliberate — consistent with freeze-and-adopt-forward)

- **No status-vocabulary remap of existing records.** v1 used `Accepted/Deprecated/Removed`
  (requirements) and `Proposed/Accepted/Superseded` (ADRs); v2's canonical sets differ. Existing
  records keep their recorded (historical) statuses; v2 status values apply to **new/changed** records.
- **No retroactive `superseded/` archival pass.** Already-terminal records stay in place; the
  `superseded/` lifecycle applies going forward. Can be a separate follow-up.
- **No BI→EPIC ID rename** (the freeze decision).

---

## Remaining confirmations before execution

- None blocking. Decisions #1–#6 above are settled. Final question is operational only:
  **commit straight to a `governance/v2-migration` branch and open a PR, or hand you the branch diff
  without a PR?**
