# User-Friendliness Ideas — Exposing the Schema 9.2.0 Backend

> Status: **finalized design input** — the source for the upcoming epic breakdown (next
> step). Resolutions below are settled; remaining open items are flagged inline and in the
> consistency check.
> Scope when acted on: `code` + `project instructions` (the epics are planning records; the
> larger bets warrant a requirement + ADR for the category and compute UI).
> Must trace to the enforced architecture: extension seams (REQ-FR-260020), adapter boundary
> (REQ-FR-260021), dual-view shared state (ADR-260032 / REQ-FR-260034), the MVP growth
> boundary (REQ-CR-260010), and branding (REQ-CR-260011 / `branding.md`).

## Headline finding

The deployed backend (**schema 9.2.0**, pinned via `backendSchemaRange: "~9.2.0"`) is far
ahead of the **UI**. The UI still exposes only the old atoms + labels + bonds model, while the
real contract in [schema.graphql](../../../docs/crystord_server/schema.graphql) has
hierarchical categories, a computed-atom engine, content typing, workspaces, atom-level
sharing, and full change history — almost none of which the UI touches yet. (Note: the written
user guide [docs/user-guide.md](../../../docs/user-guide.md) is *not* the laggard — it already
documents categories and compute and is pinned at schema 8.1.0, one additive step behind 9.2.0.
The gap is the **UI**, not the docs.) This isn't "polish the existing screens"; the UI is
showing maybe 30% of the product.

## The framing: design around five verbs, not one canvas

Today the app is essentially one verb — **Relate** (the graph) — with a thin slice of
**Classify** (labels) and **Discover** (search). The data model implies five distinct
things a user does, and each deserves a clear home:

| Verb | Backend reality | UI home today |
|---|---|---|
| **Discover** find/browse what exists | `list_labels`, `retrieveCategoryBrowse`, `retrieve` | search bar only (labels) |
| **Classify** tag & categorize | labels + hierarchical categories (dimensions→values) | comma-text box |
| **Relate** connect atoms | bonds (named, directional) | the graph (done) |
| **Compute** derive values | `operation` (SUM/MINUS/PRODUCT/DIVIDE/COLLECT), typing, dependency graph | nothing |
| **Collaborate / Audit** | workspaces, sharing, grants, change history | nothing |

Structural recommendation: **don't add more sidebars; add *modes* to two of them.**
One left **Explorer** (switchable lenses), one right **Inspector** (switchable tabs),
one persistent **query/facet bar** on top. That contains the complexity without a forest
of panels.

## The stable shell — regions as extension points (the foundation)

This is the structural spine the rest of the doc plugs into, and the thing to build **first,
once**. Good news from the codebase: **most of it already exists and is enforced** — the
foundation epic *extends* it, it doesn't invent it.

The shell is **four regions, each with one job, each a slot features register into:**

| Region | One job | Extension point | Today |
|---|---|---|---|
| **Top bar** | context + query/facet chips · account menu | query-state; settings routes | `<header>` (brand · `SearchBar` · `ThemeToggle` · Account · Sign Out) + `QuerySummary` |
| **Left rail** (collapsible) | navigate the *index* | **navigators**: Labels, Categories, … | `SearchResultPanel` (a flat result list — to be demoted) |
| **Center** (view-host) | represent the *working set* | **views** (§5): Flow · Network · Table · Board — the node-graph (Flow/Network) is home | `GraphViewTabs` switching `GraphCanvas` (= Flow view) / `NetworkCanvas` |
| **Right rail** (collapsible) | inspect/edit the *selection* | **inspector tabs**: Details, Classify, Compute, History, Share | `DetailPanel` (single, untabbed) |

**The decoupling glue is three shared-state contracts, all already shell-owned:** the
**working set** (filters → atoms in scope; `useSearch`), the **selection** (`selectedAtomId`,
lifted to the shell and fed to every view), and **preferences** (the Q3 compute-emphasis
switch; extends the existing `feature-flags.ts` pattern). Every feature reads these; **no
feature imports another feature.** That rule isn't aspirational —
[architecture.test.ts](../../../src/architecture.test.ts) already *fails the build* on
cross-feature imports, restricts `ui-shell` to feature barrels, and locks the dual-view
shared-selection model (ADR-260032). The shell already composes `useGraphData` + `useSearch` +
`selectedAtomId`. So the contracts exist; the foundation epic formalizes them as **registries**
(navigators / views / inspector tabs).

**Two things are shared, and both belong to the foundation — not to any one leaf:**
1. **The shell + the three registries** (above).
2. **A small set of shared widgets** consumed by several features: the **filter builder**
   (§2 — search + category browser + COLLECT), the **category tree** (§1 navigator + §3 atom
   "pick" mode, both permission-aware per Q2), the **label chip editor**, and the
   **atom-reference picker** (§4 typed arg slots). Build each once in the shared layer; else
   three epics each reinvent it and they stop being independent.

**Resulting dependency shape — a tree, not a chain:** one **Foundation** epic at the root
(shell + registries + shared widgets), then feature epics as **mutually independent leaves**
(each registers a navigator, a view, and/or an inspector tab). That is what makes "epic by
epic, no blocking" literally true: leaves touch slots and shared contracts, never each other —
the boundary the architecture test already enforces. The root is a real dependency, and that
is fine; the goal is leaves that don't block *each other*.

**This supersedes the "Atoms" Explorer lens.** A flat list of atoms is a *representation*, so
it belongs in the center as the **Table view** (§5), not the left rail. The left rail navigates
the *index* (Labels, Categories) — never a third atom list. (§1 and §7 are updated to match.)

## 1. Discover — labels vs categories: use *both* surfaces, with a division of labor

- **Search bar = known-item lookup.** Fast typing, prefix autocomplete from `list_labels`,
  hit enter. For "I know roughly what I want."
- **Left Explorer = structure browsing.** The "show me how the data is organized" surface —
  literally the brand promise ("the user can see what data exists"). Make it a **lens switcher**
  over the *index*: **Labels** · **Categories**. (The old "Atoms" lens is dropped — a flat atom
  list is a *representation*, so it lives in the center as the **Table view** (§5); see the
  stable-shell section.)

Key insight for **categories**: don't cram a hierarchy into a text box. The Categories lens
should be an **expanding tree / faceted browser**, and `retrieveCategoryBrowse` was built
for exactly this — it returns children + per-value `atomCount` + the atoms under a node. So
folder-style expansion with count badges comes essentially for free.

Underline this: **the category filter semantics map 1:1 onto a standard faceted-search UI.**
`retrieve(categories:)` is OR-within-a-dimension, AND-across-dimensions, with
`includeDescendants`. That's exactly how faceted filters behave everywhere. So each
**dimension is a facet group**, picking values within it is OR, stacking dimensions is AND,
and "include children" is one checkbox. Adopt a familiar model that happens to be a perfect
fit.

So: **labels → flat searchable list (bar + Explorer lens). Categories → hierarchical facet
tree (Explorer lens, primary home).** Selecting either pushes chips into the top query bar.

## 2. The unifying bet: one "filter builder" used in three places

A "narrow atoms down by labels + category facets" widget is needed in:

1. **Search** (scope the workspace)
2. **The category browser** (faceted filtering)
3. **The `COLLECT` operation** (which gathers atoms by filter)

Build it once. Today `COLLECT` only filters by labels (`atoms_with_labels`), so the
operation version starts label-only — but if the **same** facet builder is the UI, the day
the backend adds category-based collect (not yet built), the operation editor inherits it
with zero new UI. Forward-compatible, and one mental model for "filtering atoms" everywhere.

## 3. Classify — make labels and categories first-class on the atom

The right panel ([DetailPanel.tsx](../../../src/features/workspace-details/DetailPanel.tsx))
editing labels as a comma-separated string is the weakest spot.

- **Labels → chip editor with autocomplete** (`list_labels`), pinned near the top. On the
  Neo4j colored-balloon instinct: yes, but with a branding caveat. `branding.md` says *avoid
  rainbow palettes* and *never rely on color alone*. So: deterministic hash → color, drawn
  from a **restrained, desaturated** set from the brand blues/neutrals (not 12 screaming
  hues), and **always** show the text. Same label = same muted color everywhere.
- **Categories on the atom → facet chips grouped by dimension**, also near the top, visually
  distinct from labels (e.g. labels are pill chips; categories are dimension-tagged:
  `Region ▸ Belgium`). Assignment is by most-specific `valueKey` with derived ancestors, so
  show the **breadcrumb path** read-only. Editing = open the *same* category tree in "pick"
  mode.
- **Board view for bulk classify** (out-of-box): a kanban where columns are the values of one
  chosen dimension and atoms are cards; **drag a card to recategorize.** Fastest way to
  classify many atoms.

Visual distinction matters conceptually: **labels are informal/flat/fast; categories are
formal/hierarchical/structured.** Never make them look like the same thing — the backend
models them for different purposes.

## 4. Compute — the operation editor is where the real product lives

Highest-ceiling area, today a void (the field isn't even editable). Don't make people type
`{"name":"SUM","args":[...]}`. Build a **formula builder**:

- **Function picker** populated by `discoverOperations` (name + description for free —
  SUM/MINUS/PRODUCT/DIVIDE/COLLECT).
- **Typed argument slots.** Each arg is either *a reference to another atom* (picked by
  **title** via search, never a raw UUID) or *a constant key*. For `COLLECT`, the single arg
  is a registered query and the filter lives in `constants` — so that slot becomes the
  **filter builder** from §2.
- **Manual vs computed is a hard fork.** The moment an atom has an `operation`, its `content`
  is *derived* — the content editor flips to **read-only "result" mode** showing the computed
  value + how it got there. An important UX decision, not a detail.
- **Surface the evaluation contract as transparency, not error codes.** You get
  `evaluationStatus`, `errorCode`, `causes`, `cycleNodes/Edges`. Turn these into an
  **"Explain this value"** popover: "Computed by SUM of *Revenue* + *Tax*. ✓ up to date." Or
  on failure: "Couldn't compute — *Tax* failed (division by zero)." The brand's "calm
  competence" made literal.
- **Visualize computation in the graph you already have.** The system creates
  `OP_DEPENDENCY` bonds — render them as a distinct edge style ("computed-from"), badge
  computed nodes with their status (green check / red error), and **highlight cycles in red**
  using `cycleNodes/cycleEdges`. The Flow/LR view is already the perfect "how was this number
  calculated?" view. Almost free and very on-brand.

## 5. Display & views — density plus more than two layouts

The nodes ([AtomNode.tsx](../../../src/features/workspace-graph/AtomNode.tsx)) are sparse
*and* the type is too big — worst of both.

- **Level-of-detail nodes (the Blender instinct).** Zoomed out: a colored dot + short title.
  Zoomed in: reveal a dense, organized block — tiny title, a metadata row (type badge,
  computed-value, status icon), label color-dots, category-dimension dots. React Flow gives
  the zoom signal; render progressively. Small, tabular, monospace for values — the Blender
  feel.
- **A table/grid view as a first-class peer to the graph.** The user guide pitches Crystord
  as *"one spreadsheet row = one Atom"* and targets Excel/Sheets users — yet there's no
  spreadsheet-like view. A grid (title · labels · category facets · content · type · status,
  sorted by `updatedAt` like the backend default, inline-editable cells) is the **most
  familiar on-ramp** and probably the single highest-value new view.

View set to aim for: **Table** (data), **Flow** (dependencies/computation), **Network**
(relationships), **Board** (classify by dimension) — switchable from one control, same
selection model underneath.

## 6. The strategic layer not yet touched: Collaborate / Audit

**Workspaces, atom-level sharing (`shareAtom`/grants/roles), and field-level change history
(`shellies.changes`) are fully built in the backend and invisible in the UI** — and they are
the two branding pillars. "Transparency" = a **History tab** in the Inspector (who changed
what, when, with remarks). "Control" = a **Share tab** (who can see/edit this, granted by
whom). Put the Inspector tabs in place now (Details · Classify · Compute · **History** ·
**Share**) so the architecture has room, even if Share/History land later.

## 7. Account, Settings & Environment — the surface *around* the canvas

§1–§5 are about **content**; §6 is collaboration attached to *atoms*. There is a third
surface with no home today: **the user and their environment.** The backend already exposes a
full account/identity layer the UI never touches — change password (`setPassword`), email
change (`requestEmailChange`/`confirmEmailChange`), password reset, linked sign-in methods
(`authMethods` / `linkGoogle` / `unlinkAuthMethod`), and workspace membership/roles
(`createWorkspace`, `addWorkspaceMember`, `WorkspaceRole`). Same story as the data model:
built in the backend, invisible in the UI.

**The Neo4j instinct, filtered.** Neo4j Browser's left rail is the right *mindset* — a
persistent, discoverable place for system-level concerns — but copying it literally is a trap
here for one specific reason: **you already have a left rail, and §1 reserves it for
navigating the index** (the Explorer lenses: Labels · Categories). Two left sidebars would
compete. So don't put account/settings in a second left rail.

**Recommendation: a top-level user menu in the conventional corner (top-right avatar) opening
a dedicated Settings view.** This keeps the spatial model clean — left = content (Explorer),
right = selected atom (Inspector), top-right = me & my environment — and it's where every web
app trains users to look, so it needs no teaching. This is *not* a sixth verb (the five verbs
are all about content); it's the account-level complement to §6's per-atom collaboration.

**Concretely — evolve what's already there.** The top-right corner today is three loose
buttons in the `<header>`
([WorkspaceShell.tsx:61-69](../../../src/ui-shell/WorkspaceShell.tsx#L61-L69)): a `ThemeToggle`,
an **Account** button (opens the existing `AccountSettingsPanel` modal), and a **Sign Out**
button. Collapse them into **one avatar button that opens a dropdown**: identity at the top,
then settings entries (Account · Workspace · Preferences — the theme toggle folds in here), and
**Sign Out pinned at the bottom**, visually separated. This is the account epic's first,
cheapest slice — it reshapes existing controls and adds no backend calls — and it reserves the
corner for everything else in this section.

What it holds, driven by what the backend already exposes:
- **Account & identity** — username, email (`requestEmailChange`/`confirmEmailChange`), change
  password (`setPassword`), and **linked sign-in methods** (`authMethods` / `linkGoogle` /
  `unlinkAuthMethod`). This is the most necessary part — table stakes for real external users.
- **Workspace** — current workspace, switch workspace, and (for owners/admins) manage members
  & roles (`addWorkspaceMember`, `WorkspaceRole`). Workspace *switching* may warrant its own
  affordance; workspace *management* lives here. This is the account-level counterpart to §6's
  per-atom sharing.
- **Preferences** — display density / theme, and crucially **the compute-emphasis switch from
  the Q3 resolution** (Network-vs-Flow home prominence, always-on vs on-demand status badges).
  The "make it a switch" decision needs a physical home, and this is it.

**Priority:** low glamour, not a differentiator — but **password / email / auth-method
management is genuine table stakes** the moment users self-manage accounts; do that part
early. Workspace management and preferences can follow §6. Put the menu shell + Account pane
in first so the architecture has the corner reserved.

## Where I'd place my bets (impact per effort)

All of these are **leaves on the Foundation epic** (shell + registries + shared widgets, per
the stable-shell section), which comes first. After it, the order below is a priority guide,
not a dependency chain — the leaves don't block each other.

1. **Right-panel Inspector with real chip editors for labels + categories** (kills the
   comma-box, makes Classify real).
2. **Left Explorer with the Categories facet tree** (`retrieveCategoryBrowse`) — unlocks the
   whole category model.
3. **Table view** — the familiar spreadsheet on-ramp.
4. **Operation/formula builder + computation badges in the graph** — makes the dormant
   compute engine visible.
5. **Denser LOD nodes.**
6. *(Later)* History + Share tabs — high branding payoff, lower urgency.
7. *(Later, but partly table-stakes)* Account/Settings surface (§7) — top-right user menu →
   Settings view. Password / email / auth-method management is necessary plumbing the moment
   users self-manage accounts; workspace management and the Q3 compute-emphasis switch follow.
   Low glamour; mainly it reserves the top-right corner.

## Consistency check — alignment with the enforced architecture (pre-epic)

A pass over [architecture.test.ts](../../../src/architecture.test.ts) (the enforced
architecture) before carving epics:

- **Strongly aligned.** The stable-shell model *is* the architecture already in force:
  cross-feature import ban, `ui-shell`→barrel-only imports, the adapter boundary
  (REQ-FR-260021), extension seams declared "for future saved queries/views" and account
  expansion (REQ-FR-260020), and the dual-view shared-selection host (ADR-260032 /
  REQ-FR-260034). The foundation epic extends these seams; it doesn't fight them.

- **One real tension to decide — charts/analytics vs the MVP growth boundary.** Q3 commits to
  **compute-as-differentiator** ("analyst-style"). But REQ-CR-260010 (test: *"MVP growth
  boundary — excluded capabilities"*) **forbids charting/analytics dependencies** (d3, chart.js,
  recharts, nivo, plotly, victory), along with real-time-collab and plugin-runtime deps. This
  is *not* a blocker: everything in §4 (formula builder, typed args, status badges, "Explain
  this value", `OP_DEPENDENCY` edges, Table) is expressible with the **current** stack (React
  Flow + DOM) and needs no charting lib — so compute-as-differentiator ships without touching
  the contract. **Recommendation:** scope v1 compute visualization to graph/table/badges; treat
  *charts* as a deliberate, later **ICR** to amend REQ-CR-260010 only if/when charting becomes
  headline. Decide this when we carve the Compute epic — don't smuggle a charting lib in under
  "analyst."

- **§6 sharing is async, by contract.** REQ-CR-260010 also excludes real-time-collab engines,
  so §6 "Collaborate" = grants/roles + change history (async), **not** live multiplayer cursors.
  The §6 wording already matches this; keep it that way.

- **Branding holds.** §3's label-color caveat already tracks `branding.md` (REQ-CR-260011):
  desaturated brand palette, never color alone. No conflict.

**Tracing obligation for the epics:** each epic should cite the requirement(s)/ADR(s) it
extends — REQ-FR-260020/260021 and ADR-260032 for the shell/views, REQ-CR-260010 for any scope
boundary it approaches, REQ-CR-260011 for anything visual.

## Open questions — resolutions

### 1. Primary user — spreadsheet person or graph/knowledge person? — **RESOLVED**

**Graph/knowledge person is primary.** Most users are expected to think in graphs, so the
**node-graph (its Flow/Network layouts) is the priority and the "home" view.** The **Table view stays a first-class peer**
(per §5) because it genuinely helps in the view and is the most familiar on-ramp — but it
supports the graph rather than competing with it for "home." No change to the §5/bets
direction; this just confirms Graph-first, Table-strong-second.

### 2. Taxonomy authored by day-to-day users or an admin? — **RESOLVED (with a planned addition)**

**Everybody is allowed to create taxonomy.** It is authored inline by day-to-day users, not
gated behind an admin role. Practical consequence: the category tree component (Explorer
lens, atom "pick" mode) must carry **edit affordances everywhere it appears** — "＋ add
dimension / add value here", rename, drag-to-reparent. There is **no separate admin-only
management surface**.

**Planned addition (not yet implemented):** the taxonomy will gain **ownership and
permissions, mirroring the atom model** — i.e. the same grant/role/sharing mechanism that
§6 describes for atoms (`shareAtom`/grants/roles) will apply to dimensions and values too.
So "everybody can create" is the default, but each taxonomy element will eventually be
owned and shareable, with permissions controlling who can edit it. **Design implication:**
build the category tree and its edit affordances against the *same* permission model as
atom sharing from the start, so the tree's edit controls become permission-gated when the
feature lands — no rework. This ties §1/§3 (categories) directly to the §6 Collaborate/Audit
layer.

### 3. Are computed atoms a core daily feature or a power-user corner? — **RESOLVED**

**Computed atoms are a core, daily feature.** The direction is **compute-as-differentiator**
(the analyst-style product), not note-taking with compute bolted on. Rationale: computation
is the area with the most innovation potential and the clearest, most defensible payoff — a
value that *explains itself* and recomputes when its inputs change (see §4) — and it's where
the backend's lead over the UI is largest.

Consequences:
- **§4 is no longer hedged.** The formula builder, always-on status badges, `OP_DEPENDENCY`
  edges, and the **"Explain this value"** popover move from "build it but keep it opt-in" to
  **headline features**. In the bets list §4 becomes the top *strategic* bet (gated only by
  the Inspector/chip-editor groundwork in bet #1 it builds on; it stays mid-list on
  impact-*per-effort* because it's the highest-effort item).
- **Flow becomes a co-equal home** alongside Network (the relationship layout), not a
  power-user detour.

**But keep the emphasis configurable — this is the substrate decision, not a retreat from it.**
The graph+compute engine is a *shared core* that other apps (documentation, notes) are
**configurations** of; each app needs its own concrete front door rather than "graph+flow" as
a universal UI (the Blender lesson: the node graph is the engine, the viewport is home). So:
make compute the **default, prominent** emphasis now, but keep Network-vs-Flow
(relationship-vs-compute) prominence and
always-on-vs-on-demand badges a **switch** (its home is the new §7 Preferences pane). That
preserves a future note-taking/documentation configuration on the same engine without
reworking §4. **Analyst is v1; the hybrid is the destination.**

*Scope note:* compute-as-differentiator is realized with the **current** stack — dependency
graph, Flow view, status badges, "Explain this value", and Table — and needs **no** charting
library. Charts/analytics are a separate, later decision (see the consistency check).

## Planned epics — draft list (reorder before we create the files)

This is the **build list, not the epic records yet.** The order below is a *recommendation*;
reorder the leaves freely (the rank number = order; the `F#`/`L#` labels are stable IDs that
stay put when you renumber). Final `EPIC-…` IDs come from the epic index when we create the
files. **Invariant:** every leaf depends only on the foundation (F1) — never on another leaf —
so they can ship in any order, in parallel, without blocking each other.

**Foundation (root — build first; the only non-independent epic):**

1. **F1 · Foundation — App Shell, Registries & Shared Widgets** — refactor `WorkspaceShell`
   into the four-region shell (collapsible rails) + three registries (navigators · views ·
   inspector tabs) + the three shared-state contracts (working set · selection ·
   preferences-with-defaults), **plus the shared widget kit** every leaf reuses: the filter
   builder (labels + category facets, §2), the permission-aware category tree (§1/§3, used by
   both the navigator and atom "pick" mode), and the label chip editor. Ships working on
   *today's* content as the reference slice (a trivial Labels navigator, the existing
   Flow/Network views, a basic Details inspector tab) — proving the shell end-to-end with **no
   new feature logic beyond the shared widgets**. Also defines the **node-extension seam** so
   badges (L4) and LOD (L5) can layer on `AtomNode` without colliding. The one non-independent
   epic; everything below is a leaf on it.

**Leaves (independent — reorder freely; each depends only on the foundation F1):**

2. **L1 · Classify Inspector** (bet #1) — Inspector "Classify" tab: label chip editor + category
   facet chips on the atom, replacing the comma-box in `DetailPanel`. *Registers an inspector
   tab; uses F1 widgets.*
3. **L2 · Categories Navigator** (bet #2) — left-rail "Categories" lens: faceted tree via
   `retrieveCategoryBrowse`, with inline edit affordances (Q2). *Registers a navigator; uses F1.*
4. **L4 · Compute / Formula Builder** (bet #4) — Inspector "Compute" tab (formula builder, typed
   arg slots incl. an atom-reference picker, COLLECT via the F1 filter builder), status badges,
   "Explain this value", `OP_DEPENDENCY` edges, and the Flow view. *Registers an inspector tab +
   a view + node badges; uses F1; reads the F1 preferences emphasis flag.*
5. **L6 · Account & Settings** (bet #7) — top-right **avatar dropdown** (cheapest slice:
   consolidate today's ThemeToggle / Account / Sign-Out, Sign Out pinned at the bottom) →
   Settings view (Account/identity · Workspace · Preferences incl. the compute-emphasis switch).
   *Registers the top-bar account menu + settings routes; preferences write the F1 contract.*
   The dropdown slice is small and low-risk — fine to pull early if you want it sooner.
6. **L3 · Table View** (bet #3) — spreadsheet-style view (the demoted atom list), inline-editable
   cells. *Registers a view.*
7. **L5 · Level-of-Detail Nodes** (bet #5) — zoom-progressive `AtomNode` rendering. *Extends the
   node component via the F1 node seam.*
8. **L7 · History Inspector tab** (bet #6) — "History" tab: field-level change log
   (`shellies.changes`). *Registers an inspector tab.*
9. **L8 · Share Inspector tab** (bet #6) — "Share" tab: atom-level grants/roles (`shareAtom`).
   *Registers an inspector tab.* Future extension: taxonomy permissions (Q2) — not yet.
10. **L9 · Board View** (§3) — kanban for bulk classify: columns = the values of a chosen
    dimension, atoms = cards, drag a card to recategorize. *Registers a view; uses F1 (category
    dimensions).* Independent like Table (L3). **The most deferrable leaf** — if v1 should be
    leaner, drop it to the "future" bullet below; pairs naturally with the classify work (L1/L2)
    if kept.

**Notes for reordering / sizing:**
- The only place two leaves touch the same code is `AtomNode` (L4 badges + L5 LOD); F1's
  node-extension seam keeps them independent, so their relative order doesn't matter.
- Want **fewer** epics? The foundation (F1) is already merged. Remaining reasonable merge:
  L7+L8 → one "History & Share tabs" epic. The leaves are otherwise close to single-slot, so
  no obvious further splits.
- Explicitly **future** (not in this round): taxonomy ownership/permissions (Q2), and any
  charts/analytics (would need an ICR on REQ-CR-260010).
