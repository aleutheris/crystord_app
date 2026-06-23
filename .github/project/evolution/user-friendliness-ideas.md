# User-Friendliness Ideas — Exposing the v6.0.0 Backend

> Status: brainstorm / discussion notes. Not yet routed to requirements or ADRs.
> Scope when acted on: `code`, with the larger bets warranting `project instructions`
> artifacts (a requirement + ADR for the category and compute UI).

## Headline finding

The backend (v6.0.0) is roughly three major versions ahead of the UI. The markdown
guide in `docs/` still describes the 2.0.0 model (atoms + labels + bonds); the real
contract in [schema.graphql](../../../docs/crystord_server/schema.graphql) has
hierarchical categories, a computed-atom engine, content typing, workspaces, atom-level
sharing, and full change history — almost none of which the UI touches yet. This isn't
"polish the existing screens"; the UI is showing maybe 30% of the product.

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

## 1. Discover — labels vs categories: use *both* surfaces, with a division of labor

- **Search bar = known-item lookup.** Fast typing, prefix autocomplete from `list_labels`,
  hit enter. For "I know roughly what I want."
- **Left Explorer = structure browsing.** The "show me how the data is organized" surface —
  literally the brand promise ("the user can see what data exists"). Make it a **lens
  switcher**: **Atoms** (today's results) · **Labels** · **Categories**.

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

## Where I'd place my bets (impact per effort)

1. **Right-panel Inspector with real chip editors for labels + categories** (kills the
   comma-box, makes Classify real).
2. **Left Explorer with the Categories facet tree** (`retrieveCategoryBrowse`) — unlocks the
   whole v6 category model.
3. **Table view** — the familiar spreadsheet on-ramp.
4. **Operation/formula builder + computation badges in the graph** — makes the dormant
   compute engine visible.
5. **Denser LOD nodes.**
6. *(Later)* History + Share tabs — high branding payoff, lower urgency.

## Open questions — resolutions

### 1. Primary user — spreadsheet person or graph/knowledge person? — **RESOLVED**

**Graph/knowledge person is primary.** Most users are expected to think in graphs, so the
**graph is the priority and the "home" view.** The **Table view stays a first-class peer**
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

### 3. Are computed atoms a core daily feature or a power-user corner? — **UNDECIDED (leaning compute-as-differentiator)**

Still open. It depends on which of two target applications becomes the core:

- **Note-taking app** (the simpler product) → computation is a **power-user corner**: build
  the formula builder but keep it opt-in, render status badges / `OP_DEPENDENCY` edges only
  when an atom actually has an operation, keep the graph relationship-first.
- **Analyst app** (financial analysts, heavy math + charts) → computation is **core**: prime
  real estate, always-visible status badges, the Flow view as a co-equal home, "Explain this
  value" as a headline feature.

**Current lean:** computation is the area with the **most innovation potential** and the one
most worth betting on (also the most complex and the author's favorite), so the likely
direction is **compute-as-differentiator** rather than note-taking. A **hybrid** is under
consideration — serve both note-taking and analyst use cases — which is the hardest option.

**Design implication while undecided:** build the compute engine UI (§4 formula builder) as
**fully capable but with a configurable emphasis** — don't hardwire computation into prime
canvas real estate, but don't bury it either. Make the "home view" emphasis (Graph vs Flow
prominence, always-on vs on-demand badges) a **switch**, so the final core/power-user call
can be made later without reworking §4. This keeps the bet-#4 work valid under any of the
three outcomes.
