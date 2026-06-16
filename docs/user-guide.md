# Crystord User Guide

## What Crystord Is

Crystord is a data management tool for working with information as **connected units**, not just isolated records.

Its core idea is simple: instead of forcing everything into rigid tables, Crystord stores data as small meaningful items called **Atoms** and lets you connect them when they relate to each other.

This makes it useful for:
- frontend applications that need structured and connected data,
- spreadsheet-driven workflows such as Excel or Google Sheets,
- knowledge or catalog management,
- data sets where one item depends on or refers to another.

---

## Why The Product Uses Atoms

Traditional tables are good when every row looks the same and relationships are simple.
Crystord is designed for situations where:
- data changes over time,
- one record can belong to multiple categories,
- records need to reference each other,
- some values may be derived from other values.

An **Atom** is the smallest meaningful unit of information in the system.
Think of it as one business record, one note, one task, one concept, or one data point.

> If you are coming from Excel or Google Sheets, a useful mental model is: **one important row or entity = one Atom**.

---

## The Core Concepts

### Atom
An **Atom** is the main item you create, read, update, and delete.

An Atom can represent things such as:
- a project,
- a task,
- a customer,
- a document,
- a financial item,
- a note or knowledge entry.

### Labels
`labels` are categories attached to an Atom.

Use them to group and filter information.
Examples:
- `Project`
- `Task`
- `Customer`
- `Finance`

### Properties
Each Atom has two property areas:

#### `properties.shellies`
This is the **identity and system** part of the Atom.
For most users, the most important field here is:
- `uuid`: the unique identifier of the Atom

#### `properties.nuclearies`
This is the **business content** part of the Atom.
It contains the information people actually care about, such as:
- `title`
- `description`
- `content`
- optional `operation`
- optional `constants`

### Bonds
`bonds` are the links between Atoms.

A bond is:
- **named** — for example `DEPENDS_ON`, `BELONGS_TO`, or `RELATED_TO`
- **directional** — it has a direction
- **targeted** — it points to another Atom by UUID

This is how Crystord expresses relationships in the data.

---

## A Simple Mental Model

| If you think in... | In Crystord this becomes... |
|---|---|
| spreadsheet row or business record | an **Atom** |
| tab/category/tag | a **label** |
| reusable named tag | a **Category** |
| named group of related categories | a **Facet** |
| unique row ID | `properties.shellies.uuid` |
| main value or description | `properties.nuclearies` |
| lookup/reference to another row | a **bond** |
| calculated or derived field | `operation` |

---

## How The Data Is Structured

At a high level, an Atom looks like this:

```json
{
  "labels": ["Project", "Task"],
  "properties": {
    "shellies": {
      "uuid": "1c7b2b3d-1111-2222-3333-444455556666"
    },
    "nuclearies": {
      "title": "Prepare launch plan",
      "description": "Planning task for the next release",
      "content": "In progress",
      "operation": "",
      "constants": {}
    }
  },
  "bonds": [
    {
      "name": "DEPENDS_ON",
      "uuid": "8a8f1aaf-7777-8888-9999-000011112222",
      "direction": "from"
    }
  ]
}
```

### What this means in plain language
- the Atom is classified as both `Project` and `Task`,
- it has its own unique identifier,
- its user-facing content is the title, description, and current value,
- it is connected to another Atom through a `DEPENDS_ON` relationship.

---

## Using Crystord Through GraphQL

The API is exposed through GraphQL at:

```text
http://<host>:5665/graphql
```

After signing up or signing in, use your token in the request header for authenticated operations:

```text
Authorization: Bearer <your-token>
```

### What the main GraphQL operations do

| Operation | Type | Plain-English purpose |
|---|---|---|
| `signup` | Mutation | Create an account and receive an access token |
| `signin` | Query | Sign in and receive an access token |
| `signinGoogle` | Query | Sign in with a Google ID token |
| `getGoogleClientID` | Query | Retrieve the Google client ID used for sign-in flows |
| `schemaInfo` | Query | Retrieve schema version, hash, and release date for compatibility checks |
| `retrieve` | Query | Read Atoms by UUID or by labels |
| `listLabels` | Query | List available labels starting with a prefix |
| `discoverOperations` | Query | Discover callable operation functions, optionally filtered by prefix |
| `change` | Mutation | Create new Atoms or update existing ones |
| `destroy` | Mutation | Delete Atoms |
| `createFacet` | Mutation | Create a Facet (classification dimension) |
| `createCategory` | Mutation | Create a Category, optionally assigning it to a Facet |
| `assignCategoryToFacet` | Mutation | Assign an existing Category to a Facet |
| `retrieveFacets` | Query | Retrieve Facets, optionally filtered by key or uuid |
| `retrieveCategories` | Query | Retrieve Categories, optionally filtered by key, uuid, or facetUuid |

> Important: `change` is the main write operation. It is used both to **create** and to **update** data.

### Public GraphQL Contract (Complete)

This section is the complete user-facing contract for the current schema.

#### Queries

- `retrieve(labels: [String], uuid: String): [AtomOutput!]`
  - Auth required.
  - Use `uuid` for single-atom retrieval or `labels` for grouped retrieval.
- `listLabels(labelsPrefix: String!): [String!]!`
  - Auth required.
  - Returns distinct labels starting with the given prefix.
- `discoverOperations(prefix: String, limit: Int): [OperationFunction!]!`
  - No bearer token required.
  - `limit` is optional; backend caps the effective limit at 100.
- `retrieveFacets(selector: FacetSelector): [FacetOutput!]!`
  - No bearer token required.
  - `selector` is optional. Omit to return all Facets.
  - Filter by `key` or `uuid`.
- `retrieveCategories(selector: CategorySelector): [CategoryOutput!]!`
  - No bearer token required.
  - `selector` is optional. Omit to return all Categories.
  - Filter by `key`, `uuid`, or `facetUuid`.
  - Each result includes `facetUuid` (null if the Category is not yet assigned to a Facet).
- `schemaInfo: SchemaInfo!`
  - No bearer token required.
  - Returns `schemaVersion`, `schemaHash`, and `releasedAt`.
- `signin(email: String!, password: String!): String!`
  - No bearer token required.
  - Returns an access token.
- `signinGoogle(idToken: String!): String!`
  - No bearer token required.
  - Returns an access token.
- `getGoogleClientID: String!`
  - No bearer token required.

#### Mutations

- `signup(email: String!, password: String!, username: String): String!`
  - No bearer token required.
  - Returns an access token.
- `change(selector: Selector, inputs: [AtomInput]!, remark: String): [String]!`
  - Auth required.
  - Create mode: omit `selector`.
  - Update mode: provide `selector.uuid`.
  - In both modes, each `AtomInput` requires `labels`.
  - `remark` is optional. If provided, it is stored with the change event and visible in change history.
- `createFacet(key: String!, displayName: String!): FacetOutput!`
  - No bearer token required.
  - `key` must be unique across all Facets. Duplicate raises `CR-14-DUPLICATE-KEY`.
  - Returns the newly created Facet record.
- `createCategory(key: String!, displayName: String!, facetUuid: ID): CategoryOutput!`
  - No bearer token required.
  - `key` must be unique across all Categories. Duplicate raises `CR-10-DUPLICATE-KEY`.
  - `facetUuid` is optional. If supplied, the Category is assigned to that Facet in the same operation.
  - Returns the newly created Category record, including `facetUuid` if assigned.
- `assignCategoryToFacet(categoryUuid: ID!, facetUuid: ID!): Boolean!`
  - No bearer token required.
  - Assigns an existing Category to an existing Facet.
  - A Category may only have **one** Facet parent. A second assignment raises `CR-14-ALREADY-ASSIGNED`.
  - Returns `true` on success.
- `destroy(selector: DestroySelector!): DestroyOutcome!`
  - Auth required.
  - Supports either `selector.uuids` or `selector.uuid`.
  - If only `uuid` is provided, backend normalizes it to `uuids` internally.
  - Returns a `DestroyOutcome` with three fields:
    - `requested: [String!]!` — UUIDs submitted for deletion.
    - `deleted: [String!]!` — UUIDs that were actually deleted.
    - `notFound: [String!]!` — UUIDs that were not deleted (not found or not owned by the caller).
  - **Migration note (schema 2.0.0):** Previous schema versions returned `[String]!` (deleted UUIDs only). Callers that consumed the old list should now read `destroy { deleted }` for equivalent behaviour; `requested` and `notFound` provide additional observability at no extra cost.
  - No-op deletes (all UUIDs in `notFound`, empty `deleted`) do not raise errors.

#### Input Types (Current)

- `AtomInput`
  - `labels: [String!]!`
  - `bonds: [BondInput]`
  - `properties: PropertiesInput`
- `PropertiesInput`
  - `shellies: ShelliesInput` (`uuid` input only)
  - `nuclearies: NucleariesInput`
- `NucleariesInput`
  - `title`, `description`, `operation`, `constants`
  - `content: JSON` — accepts a string, number, JSON array (list atom), or null
  - `declaredType` (typed declaration input)
  - `typeMode` (`flexible` or `strict`)
- `Selector`
  - `labels`, `uuid`, `uuids`, `title`, `content`, `description`, `operation`, `constants`
  - Practical usage guidance:
    - `change` update path should use `selector.uuid`.
    - `destroy` should use `selector.uuids` (or `selector.uuid` for single delete).

#### Output Typing Fields (Current)

`AtomOutput.properties.nuclearies` exposes:

- `declaredType`
- `effectiveType`
- `typeMode`
- `typeState`

These fields are user-visible typing semantics and should be included by clients that need content-typing behavior.

#### Atom/Bond Output Fields (Current)

`AtomOutput` also exposes:

- `errorCode`
- `evaluationStatus`
- `cycleNodes`
- `cycleEdges`
- `originNodeUuid`
- `affectedNodeUuid`
- `causes`

`BondOutput` exposes:

- `uuid`
- `name`
- `direction`
- `required` (nullable; present for relationship types that carry required/optional semantics)

#### Behavior and Constraints (Current)

- `operation` is represented as a GraphQL string field at the boundary.
- Canonical function-style operation payloads are supported by runtime behavior and are serialized at the boundary as string values.
- `OP_DEPENDENCY` bonds are system-managed; clients should not submit them directly.
- `change` requires `labels` in each input object, including update payloads.

##### Taxonomy: Facets, Categories, and Labels

Crystord has three independent classification mechanisms. Use whichever fits your needs.

| Mechanism | What it is | Best for |
|---|---|---|
| `labels` | Free-form strings on an Atom | Fast grouping and retrieval, no management needed |
| `Category` | A named classification value, connected to an Atom via `IN_CATEGORY` | Reusable classification that survives renaming |
| `Facet` | A named classification dimension that organises Categories | Structured taxonomy when you have many categories in the same subject area |

**Labels** are the simplest option. Apply them directly on any Atom and use `retrieve(labels: [...])` or `listLabels(labelsPrefix: ...)` to work with them. No setup required.

**Categories** are useful when you want stable, named classification that can be managed independently of Atoms. A Category is a first-class entity with its own `uuid` and `key`. An Atom connects to a Category using a bond named `IN_CATEGORY`:

```json
{ "uuid": "<category-uuid>", "name": "IN_CATEGORY", "direction": "to" }
```

**Facets** are classification dimensions that group related Categories. If you have many Categories in the same subject area (for example `Mercedes`, `Tesla`, `BMW` all belong to the `Brand` dimension), create a Facet named `brand` and assign each of those Categories to it. An Atom does not connect directly to a Facet — it always connects to a Category, which belongs to a Facet.

The three-level chain:

```
(Atom) -[:IN_CATEGORY]-> (Category) -[:IN_FACET]-> (Facet)
```

**Facet rules:**
- `Facet.key` is unique. Duplicate raises `CR-14-DUPLICATE-KEY`.
- A Category may belong to at most one Facet (tree structure). A second assignment raises `CR-14-ALREADY-ASSIGNED`.
- `IN_FACET` is not a valid bond name on an Atom — only Categories may connect to Facets.
- Facets and Categories are system-global (not scoped to individual users).

**Working example — cars:**

```graphql
# 1. Create a Facet for the classification dimension
mutation {
  createFacet(key: "brand", displayName: "Brand") {
    uuid key displayName
  }
}

# 2. Create Categories and assign them to the Facet in one step
mutation {
  createCategory(key: "mercedes", displayName: "Mercedes", facetUuid: "<brand-uuid>") {
    uuid key displayName facetUuid
  }
}

# 3. Tag an Atom with the Mercedes category using a normal bond
mutation {
  change(inputs: [{
    labels: ["Car"]
    bonds: [{ uuid: "<mercedes-uuid>", name: "IN_CATEGORY", direction: "to" }]
    properties: { nuclearies: { title: "My car" } }
  }])
}

# 4. Retrieve all Categories in the Brand facet
query {
  retrieveCategories(selector: { facetUuid: "<brand-uuid>" }) {
    uuid key displayName facetUuid
  }
}
```

**Remaining Category behavior (unchanged):**
- Category identity uses `uuid` and unique `key`; `displayName` is the human-readable field.
- The category assignment contract is `(Atom)-[:IN_CATEGORY]->(Category)`.
- Duplicate `Category.key` values are rejected with `CR-10-DUPLICATE-KEY`.
- Query pagination defaults to `limit=25` with `max limit=100`.
- Retrieval order is deterministic: `updatedAt DESC` with `uuid ASC` as the tie-breaker.
- Requests beyond the allowed limit are rejected with `OR-QUERY-LIMIT-EXCEEDED`.

##### Owner-Only Lifecycle Behavior (MVP)

All atom lifecycle operations are owner-scoped in MVP. This means a caller only sees and changes atoms they own.

Non-owner outcomes by operation:

- `retrieve` (by `uuid` or `labels`): returns an empty list for atoms not owned by the caller.
- `change` update path (`selector.uuid`): returns an empty result if the selected atom is not owned by the caller.
- `destroy`: non-owner delete attempts are silent no-ops; the foreign atom remains unchanged.
- `change` with explicit foreign bond target UUID: hard-fails with `AU-UNAUTHORIZED`.

Why this is split into two denial styles:

- Scoped operations (`retrieve`, update, delete) avoid leaking whether a foreign atom exists.
- Explicit-reference operations (bonding to a foreign UUID) fail with a stable unauthorized error code.

Short lifecycle example (owner vs non-owner):

1. User A creates atom `A1`.
2. User B runs `retrieve(uuid: "A1")` -> `[]`.
3. User B runs `change(selector: {uuid: "A1"}, ...)` -> `[]` (no update).
4. User B runs `destroy(selector: {uuids: ["A1"]})` -> no error, atom still exists for User A.
5. User B tries to create/update an atom with `bonds: [{uuid: "A1", ...}]` -> error `AU-UNAUTHORIZED`.

---

## Authentication

### Sign up

```graphql
mutation {
  signup(
    email: "user@example.com"
    password: "strong-password"
    username: "demo-user"
  )
}
```

This returns an access token.

### Sign in

```graphql
query {
  signin(
    email: "user@example.com"
    password: "strong-password"
  )
}
```

This also returns an access token.

### Google sign-in

```graphql
query {
  signinGoogle(idToken: "google-id-token")
}
```

If a client application needs the Google client ID:

```graphql
query {
  getGoogleClientID
}
```

### Testing note for Google sign-in

For CI and local automated tests, Crystord intentionally tests the Google sign-in **error path** without real Google credentials.

- Tests use a placeholder client ID value instead of reading secret files.
- Tests mock Google token verification to force the invalid-token path deterministically.
- This keeps secrets out of source control and CI while still validating Crystord's user-facing error behavior (`Invalid ID token`).

This test strategy only applies to automated test isolation; production runtime behavior remains unchanged.

---

## Reading Data

### Retrieve one Atom by UUID

```graphql
query {
  retrieve(uuid: "1c7b2b3d-1111-2222-3333-444455556666") {
    labels
    bonds {
      uuid
      name
      direction
      required
    }
    properties {
      shellies {
        uuid
      }
      nuclearies {
        title
        description
        content
        operation
        constants
      }
    }
  }
}
```

Use this when you already know the Atom you want.

### Retrieve Atoms by label

```graphql
query {
  retrieve(labels: ["Project"]) {
    labels
    properties {
      shellies {
        uuid
      }
      nuclearies {
        title
        description
        content
      }
    }
  }
}
```

Use this to fetch groups of Atoms by category.

### List available labels

```graphql
query {
  listLabels(labelsPrefix: "Pro")
}
```

This is useful for building pickers, filters, or autocomplete interfaces.

### Read change history for an Atom

Each Atom's `shellies` exposes a `changes` field that returns a paginated list of change events.

```graphql
query {
  retrieve(uuid: "1c7b2b3d-1111-2222-3333-444455556666") {
    properties {
      shellies {
        uuid
        changes(limit: 5, offset: 0) {
          timestamp
          eventType
          userId
          remark
          propertyChanges {
            field
            oldValue
            newValue
            metrics {
              removedCount
              addedCount
              totalMembersAfter
            }
          }
        }
      }
    }
  }
}
```

- `limit` defaults to 5, `offset` defaults to 0.
- Events are returned newest-first.
- `metrics` is only present for list-type content fields; it is null for scalar fields.
- `remark` is present when the caller supplied one in the `change` mutation; otherwise null.

### Get schema compatibility information

```graphql
query {
  schemaInfo {
    schemaVersion
    schemaHash
    releasedAt
  }
}
```

Use this to detect API/schema compatibility in clients and deployment pipelines.

### Discover available operation functions

```graphql
query {
  discoverOperations(prefix: "S", limit: 10) {
    name
    description
  }
}
```

Use this to build operation authoring UX (for example, type-ahead pickers).

Notes:
- `prefix` is optional. If omitted, all user-visible functions are returned.
- `limit` is optional. Server-side max limit is 100.

---

## Creating Data

To create a new Atom, call `change` **without** a selector.

```graphql
mutation {
  change(
    inputs: [
      {
        labels: ["Project"]
        properties: {
          nuclearies: {
            title: "Website redesign"
            description: "Q2 initiative"
            content: "Planned"
            operation: ""
            constants: {}
          }
        }
      }
    ]
  )
}
```

This returns a list of created identifiers.

### Create an Atom with a bond to another Atom

```graphql
mutation {
  change(
    inputs: [
      {
        labels: ["Task"]
        bonds: [
          {
            uuid: "8a8f1aaf-7777-8888-9999-000011112222"
            name: "DEPENDS_ON"
            direction: "from"
          }
        ]
        properties: {
          nuclearies: {
            title: "Prepare launch checklist"
            description: "Depends on approval step"
            content: "Not started"
          }
        }
      }
    ]
  )
}
```

Use bonds when the meaning of one Atom depends on or relates to another.

---

## Updating Data

To update an Atom, call `change` **with** a selector.

```graphql
mutation {
  change(
    selector: {
      uuid: "1c7b2b3d-1111-2222-3333-444455556666"
    }
    inputs: [
      {
        labels: ["Project"]
        properties: {
          nuclearies: {
            title: "Website redesign - approved"
            content: "Active"
          }
        }
      }
    ]
  )
}
```

This is the standard way to change the title, description, content, or relationships of an existing Atom.

> Note: in the GraphQL schema, each `AtomInput` requires `labels`, so include them in your update payload.

---

## Deleting Data

```graphql
mutation {
  destroy(
    selector: {
      uuids: ["1c7b2b3d-1111-2222-3333-444455556666"]
    }
  )
}
```

Use this when an Atom should be removed from the system.

---

## Operations Reference

This section documents every callable function available in Crystord.
Use `discoverOperations` to retrieve these descriptions programmatically for building function pickers or autocomplete UIs.

---

### SUM

Adds numeric values together.

**Arguments:** one or more atom UUID references or constant keys, all numeric.

**Shape rules:**

| Input | Result |
|---|---|
| `SUM(scalar)` | the scalar value itself |
| `SUM(list)` | scalar — sum of all elements |
| `SUM(2D list)` | 1D list — sum per column |
| `SUM(a, b, …)` same shape | same shape — element-wise sum |
| `SUM(scalar, list)` | same shape as list — scalar added to every element |
| `SUM(1D list, 2D list)` | same shape as 2D list — each row summed with the 1D list |

Incompatible inner-axis sizes raise `OP-SIG-SHAPE-MISMATCH`.

**Examples:**

```
SUM(revenue_uuid, tax_uuid)         → 1150   (revenue=1000, tax=150)
SUM(prices_list_uuid)               → 9      (prices=[3, 4, 2])
SUM(q1_list_uuid, q2_list_uuid)     → [5, 7] (q1=[2,3], q2=[3,4])
```

**Operation payload:**
```json
{"name": "SUM", "args": ["<uuid-of-atom-a>", "<uuid-of-atom-b>"]}
```

---

### MINUS

Subtracts the second argument from the first.

**Arguments:** exactly two atom UUID references or constant keys, both numeric.

**Examples:**

```
MINUS(total_uuid, discount_uuid)    → 80     (total=100, discount=20)
MINUS(revenue_uuid, cost_uuid)      → 250    (revenue=600, cost=350)
```

**Operation payload:**
```json
{"name": "MINUS", "args": ["<uuid-of-minuend>", "<uuid-of-subtrahend>"]}
```

---

### PRODUCT

Multiplies two or more numeric values together.

**Arguments:** two or more atom UUID references or constant keys, all numeric.

**Examples:**

```
PRODUCT(price_uuid, quantity_uuid)          → 300    (price=15, quantity=20)
PRODUCT(price_uuid, quantity_uuid, vat_uuid)→ 363    (price=15, quantity=20, vat=1.21)
```

**Operation payload:**
```json
{"name": "PRODUCT", "args": ["<uuid-of-price>", "<uuid-of-quantity>"]}
```

---

### DIVIDE

Divides the first argument by the second.

**Arguments:** exactly two atom UUID references or constant keys, both numeric. Division by zero raises `OP-DIVISION-BY-ZERO`.

**Examples:**

```
DIVIDE(revenue_uuid, headcount_uuid)    → 50000   (revenue=500000, headcount=10)
DIVIDE(profit_uuid, revenue_uuid)       → 0.25    (profit=250, revenue=1000)
```

**Operation payload:**
```json
{"name": "DIVIDE", "args": ["<uuid-of-dividend>", "<uuid-of-divisor>"]}
```

---

### COLLECT

Queries the database at evaluation time and returns a list of atom references as CT-5 ref cells (`{"ref": "<uuid>"}`). Unlike the arithmetic operations, COLLECT does not compute over already-fetched atoms — it issues a database query and returns the matching set.

**Arguments:** exactly one argument — the name of a registered query (a key in `crystord_server/collect_queries.json`).

**Parameters:** runtime values are supplied via the atom's `constants` map. Each registered query declares which `constants` keys it requires.

**Output:** a list of `{"ref": "<uuid>"}` cells. Consuming operations such as SUM expand these refs automatically.

**Point-in-time semantics:** content reflects database state at the moment of evaluation. No live invalidation occurs when matching atoms are created, updated, or deleted.

**Currently registered queries:**

| Query name | Required constants | Behaviour |
|---|---|---|
| `atoms_with_labels` | `labels` (list of strings) | Returns all atoms owned by the calling user that have **all** of the specified labels (AND semantics). |

**Examples:**

```
COLLECT(atoms_with_labels)  constants: {"labels": ["Invoice"]}
→ all Invoice atoms owned by the calling user

COLLECT(atoms_with_labels)  constants: {"labels": ["Invoice", "2025"]}
→ atoms that have both Invoice AND 2025 labels
```

**Operation payload:**
```json
{"name": "COLLECT", "args": ["atoms_with_labels"]}
```

**GraphQL `change` input (collect all Invoice atoms and sum them):**
```graphql
mutation {
  change(inputs: [{
    labels: ["InvoiceTotal"]
    properties: {
      nuclearies: {
        title: "Total invoiced"
        operation: "{\"name\": \"COLLECT\", \"args\": [\"atoms_with_labels\"]}"
        constants: "{\"labels\": [\"Invoice\"]}"
      }
    }
  }])
}
```

---

## When To Use `operation` and `constants`

Most users can ignore these fields at first.

They are helpful when the content of one Atom should be **derived** from other information instead of being entered manually.
For example, a value might be calculated from related Atoms or from fixed constant values.

Operation contract notes (current behavior):
- `operation` is stored as a string in GraphQL input/output, but the canonical payload is function-style JSON.
- Canonical shape is:

```json
{"name":"SUM","args":["<atom-uuid>","taxRate"]}
```

- `args` entries can be:
  - atom UUID references (resolved at evaluation time),
  - constant keys resolved from `constants`.
- Callable names are: `SUM`, `MINUS`, `PRODUCT`, `DIVIDE`, `COLLECT`.
- If `operation` is cleared/empty, system-managed `OP_DEPENDENCY` bonds are removed/recomputed automatically.
- Clients must not submit `OP_DEPENDENCY` bonds directly in `bonds`; these are system-managed.

If you do not need calculated behavior yet, it is fine to leave `operation` and `constants` empty.

---

## Suggested Usage Pattern For Business Teams

A simple and practical approach is:

1. Use **labels** to define business categories.
2. Use **title** as the human-readable name.
3. Use **description** for context.
4. Use **content** for the main value or body of information.
5. Use **bonds** whenever one item refers to or depends on another.
6. Use **uuid** whenever you need to update, connect, or delete a specific Atom.

---

## Example End-To-End Flow

A typical usage flow looks like this:

1. `signup` or `signin` to get a token.
2. `change` without a selector to create Atoms.
3. `change` with `bonds` to connect related Atoms.
4. `retrieve` by label or UUID to read the data back.
5. `change` with a selector to update an existing Atom.
6. `destroy` if an Atom is no longer needed.

---

## Computed Atoms — Evaluation Contract

When an Atom has an `operation` field, its `content` is computed at retrieval time from its dependency chain.

### `evaluationStatus`

Every returned Atom includes an `evaluationStatus` field:

| Status | Meaning |
|--------|---------|
| `success` | Operation evaluated successfully, or Atom has no operation. |
| `failed-origin` | This Atom's own operation failed (e.g. type mismatch, missing required dependency, division by zero). |
| `failed-propagated` | This Atom's evaluation failed because a dependency it relied on also failed. |
| `skipped-optional` | A dependency was absent but declared optional — the Atom is skipped without error. |

### Failure-Reporting Fields (OR-11)

When `evaluationStatus` is `failed-origin` or `failed-propagated`, the following fields are also set:

- `originNodeUuid` — UUID of the atom where the failure originated (may differ from `affectedNodeUuid` for propagated failures).
- `affectedNodeUuid` — UUID of the atom being reported on.
- `causes` — Sorted list of dependency UUIDs that failed and contributed to this failure.

For `success` and `skipped-optional`, these fields are present with the atom's own UUID as both `originNodeUuid` and `affectedNodeUuid`, and `causes` is an empty list.

### Cycle Detection

If a cycle is detected in the dependency graph (an Atom depends on itself through any chain), the top-level Atom receives:

- `errorCode: "AU-CYCLE-DETECTED"`
- `evaluationStatus: "failed-origin"`
- `cycleNodes` — sorted list of UUIDs involved in the cycle.
- `cycleEdges` — list of `{ from, to }` objects representing the cycle path.

### No Partial Persistence (CR-6)

Computed content is only written back to the database if **all** atoms in the request evaluated successfully. If any atom has status `failed-origin` or `failed-propagated`, no write-back occurs for the entire request.

### Required vs Optional Dependencies

All system-generated `OP_DEPENDENCY` bonds are required by default. A dependency UUID referenced in an operation string that is absent from the dependency path will cause `AU-DEPENDENCY-MISSING`. Optional dependencies (bond `required: false`) that are absent produce `skipped-optional` instead.

---

## Final Takeaway

Crystord is best understood as a way to manage **connected business information**.

- An **Atom** is one meaningful unit of data.
- **Labels** classify it quickly without setup.
- **Categories** give it reusable, stable classification values.
- **Facets** organise Categories into named dimensions when your taxonomy grows.
- **Properties** hold its identity and content.
- **Bonds** connect it to other Atoms (and to Categories via `IN_CATEGORY`).
- GraphQL gives you a simple way to create, retrieve, update, and delete those items.

If you are building a frontend or integrating from a non-coding workflow, the main thing to learn is not the internal implementation — it is the **meaning of the Atom model** and the small set of GraphQL operations available to work with it.
