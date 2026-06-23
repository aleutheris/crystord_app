# Crystord User Guide

> **Schema version: `8.1.0`.** This guide matches the live GraphQL schema exactly
> (`crystord_server/schema.graphql`). Always confirm the version your deployment serves with the
> `schemaInfo` query before relying on a contract detail.

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

### Categories (Dimensions & Values)
Crystord also has a structured classification system built from two node kinds:

- A **Category Dimension** is a classification axis — for example `Brand`, `Region`, or `Status`.
- A **Category Value** is a specific value within a dimension — for example `Mercedes` within `Brand`.

Dimensions can form a hierarchy (a dimension can be *under* a parent dimension), and Values can
form a hierarchy too (a value can be *under* a parent value, e.g. `Sedan` under `Car`). An Atom is
classified by assigning it one or more **Values** (the dimension is derived from the value).

> **Categories are NOT bonds.** They are assigned through `AtomInput.categories`, not through
> `bonds`. See [Categories (Dimensions & Values)](#categories-dimensions--values-1) below.

---

## A Simple Mental Model

| If you think in... | In Crystord this becomes... |
|---|---|
| spreadsheet row or business record | an **Atom** |
| tab/category/tag | a **label** |
| a classification axis (e.g. "Brand") | a **Category Dimension** |
| a value on that axis (e.g. "Mercedes") | a **Category Value** |
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

After signing in (or completing signup), pass your **session token** in the request header for
authenticated operations:

```text
Authorization: Bearer <your-session-token>
```

> **Sessions, not permanent tokens.** The token you receive is a **session** bearer token. It
> **expires** (idle timeout ~24h, absolute cap ~30 days) and can be **revoked** (`logout`,
> `revokeAllSessions`, password reset, email change). Clients MUST handle an expired/invalid token
> by re-authenticating. See [Authentication](#authentication).

### Authorization model (default-deny)

Every operation is authorized centrally. There are two outcomes a client must handle:

- **Public operations** (no token needed): `signin`, `signinGoogle`, `schemaInfo`,
  `discoverOperations`, `beginSignup`, `completeSignup`, `requestPasswordReset`,
  `confirmPasswordReset`, `logout`.
- **Everything else requires a valid Bearer session token.** Calling a gated operation without a
  valid token returns a GraphQL error with code `AUTHZ-AUTHENTICATION-REQUIRED`.

> Errors are returned in the standard GraphQL `errors` array (the `message` carries the code, e.g.
> `AUTH-RATE-LIMITED`, `SIGNUP-INVALID-OR-EXPIRED-CODE`). They are not returned as a data field.

### What the main GraphQL operations do

| Operation | Type | Auth | Plain-English purpose |
|---|---|---|---|
| `beginSignup` | Mutation | Public | Start signup: email a single-use verification code |
| `completeSignup` | Mutation | Public | Finish signup with the code + password + username; returns a session token |
| `signin` | Query | Public | Sign in with email + password; returns a session token |
| `signinGoogle` | Query | Public | Sign in with a Google ID token; returns a session token |
| `logout` | Mutation | Public | End the current session |
| `revokeAllSessions` | Mutation | Auth | End all of the caller's sessions |
| `requestPasswordReset` | Mutation | Public | Email a single-use password-reset token |
| `confirmPasswordReset` | Mutation | Public | Set a new password using the reset token |
| `requestEmailChange` | Mutation | Auth | Email a code to a new address to change the login email |
| `confirmEmailChange` | Mutation | Auth | Confirm the email change with the code |
| `linkGoogle` | Mutation | Auth | Link Google sign-in to the caller's account |
| `setPassword` | Mutation | Auth | Set/replace the caller's password |
| `unlinkAuthMethod` | Mutation | Auth | Remove a linked auth method (never the last one) |
| `me` | Query | Auth | The caller's own account + linked auth methods |
| `deleteMyAccount` | Mutation | Auth | Self-service account deletion |
| `schemaInfo` | Query | Public | Schema version, hash, and release date for compatibility checks |
| `retrieve` | Query | Auth | Read Atoms by UUID, by labels, and/or by category |
| `listLabels` | Query | Auth | List available labels starting with a prefix |
| `discoverOperations` | Query | Public | Discover callable operation functions |
| `change` | Mutation | Auth | Create new Atoms or update existing ones |
| `destroy` | Mutation | Auth | Delete Atoms |
| `shareAtom` / `revokeAtomAccess` | Mutation | Auth | Grant/revoke access to an atom (by username or workspace key) |
| `transferAtomOwnership` | Mutation | Auth | Hand an atom to another user (by username) |
| `listAtomGrants` | Query | Auth | List access grants on an atom |
| `createWorkspace` … `updateWorkspaceMemberRole` | Query/Mutation | Auth | Workspaces and membership |
| `createCategoryDimension` / `createCategoryValue` … | Mutation | Auth | Manage the category taxonomy |
| `retrieveCategoryDimensions` / `retrieveCategoryValues` / `retrieveCategoryBrowse` | Query | Auth | Read/browse the taxonomy |

> Important: `change` is the main write operation. It is used both to **create** and to **update** data.

### Public GraphQL Contract (Complete)

This section is the complete user-facing contract for schema `8.1.0`. Every operation that requires
a token is marked **Auth required**; everything else is public.

#### Queries

- `retrieve(labels: [String], uuid: String, categories: [CategoryFilterInput!]): [AtomOutput!]`
  - Auth required.
  - Use `uuid` for single-atom retrieval, `labels` for grouped retrieval, and/or `categories` to
    filter by category value (see [Categories](#categories-dimensions--values-1)).
- `signin(email: String!, password: String!): String!`
  - Public. Returns a session token.
- `signinGoogle(idToken: String!): String!`
  - Public. Returns a session token.
  - An existing account is signed in **only if Google is already linked** to it; otherwise
    `AUTH-GOOGLE-NOT-LINKED`. An unknown email creates a new (verified, password-less) account.
- `me: User!`
  - Auth required. Returns the caller's own account: `username`, `email`, `emailVerified`,
    `authMethods` (e.g. `["password", "google"]`). Never returns secrets.
- `listLabels(labelsPrefix: String!): [String!]!`
  - Auth required. Returns distinct labels starting with the given prefix.
- `schemaInfo: SchemaInfo!`
  - Public. Returns `schemaVersion`, `schemaHash`, and `releasedAt`.
- `discoverOperations(prefix: String, limit: Int): [OperationFunction!]!`
  - Public. `limit` is optional; backend caps the effective limit at 100.
- `listAtomGrants(atomUuid: ID!): [AtomGrantOutput!]!`
  - Auth required. Owner-only. Lists the direct access grants on an atom.
- `listMyWorkspaces: [WorkspaceOutput!]!`
  - Auth required. Workspaces the caller is a member of.
- `listWorkspaceMembers(workspaceUuid: ID!): [WorkspaceMemberOutput!]!`
  - Auth required.
- `retrieveWorkspace(selector: WorkspaceSelector!): WorkspaceOutput`
  - Auth required. Select by `uuid` or `key`.
- `listAtomsSharedToWorkspace(workspaceUuid: ID!): [ID!]!`
  - Auth required.
- `retrieveCategoryDimensions(selector: CategoryDimensionSelector): [CategoryDimensionOutput!]!`
  - Auth required. `selector` optional; omit to return all dimensions.
- `retrieveCategoryValues(selector: CategoryValueSelector): [CategoryValueOutput!]!`
  - Auth required. `selector` optional; omit to return all values.
- `retrieveCategoryBrowse(valueKey: String, dimensionKey: String, limit: Int, offset: Int, childLimit: Int, childOffset: Int): CategoryBrowseOutput!`
  - Auth required. Provide **exactly one** of `valueKey` or `dimensionKey`. Drill-down browse:
    returns the focus value (if any), its immediate children with access-scoped atom counts, and the
    atoms under the focus. See [Categories](#categories-dimensions--values-1).

#### Mutations — Authentication & Account

- `beginSignup(email: String!): Boolean!`
  - Public. Emails a single-use 6-digit verification code and creates a transient pending signup.
  - Always returns `true` (anti-enumeration): an already-registered email receives a "you already
    have an account" message instead of a code.
- `completeSignup(email: String!, code: String!, password: String!, username: String!): String!`
  - Public. Verifies the code, creates an **already-verified** account, and returns a session token.
  - `username` is **required** and must satisfy the username form rules (see
    [Username rules](#username-rules)); an invalid handle raises `USER-INVALID-USERNAME`.
  - `password` must satisfy the [password policy](#password-policy).
  - A wrong/expired code raises `SIGNUP-INVALID-OR-EXPIRED-CODE`. If an account for the email
    appeared in the meantime, `SIGNUP-ACCOUNT-ALREADY-EXISTS`.
- `logout: Boolean!`
  - Public (idempotent). Ends the session of the presented Bearer token.
- `revokeAllSessions: Boolean!`
  - Auth required. Ends every session of the caller (sign out everywhere).
- `requestPasswordReset(email: String!): Boolean!`
  - Public. Emails a single-use high-entropy reset token. Always returns `true` (anti-enumeration).
- `confirmPasswordReset(token: String!, newPassword: String!): Boolean!`
  - Public. Consumes the token (single-use), sets the new password, and **revokes all sessions**.
  - `newPassword` must satisfy the [password policy](#password-policy). Invalid/expired token →
    `RESET-INVALID-OR-EXPIRED-TOKEN`.
- `requestEmailChange(newEmail: String!): Boolean!`
  - Auth required. Emails a 6-digit code to the **new** address.
- `confirmEmailChange(code: String!): Boolean!`
  - Auth required. Switches the login email, keeps the account, revokes other sessions (keeps the
    current one), and notifies the old address. A taken target → `EMAIL-ALREADY-IN-USE`; wrong/expired
    code → `EMAIL-CHANGE-INVALID-OR-EXPIRED-CODE`.
- `linkGoogle(idToken: String!): Boolean!`
  - Auth required. Links Google to the caller's account; the verified Google email must equal the
    caller's email (`AUTH-GOOGLE-EMAIL-MISMATCH` otherwise). Idempotent.
- `setPassword(newPassword: String!): Boolean!`
  - Auth required. Sets/replaces the caller's password (e.g. a Google-only account gains password
    sign-in). No old-password argument — the session is the authorization. Sessions are not revoked.
- `unlinkAuthMethod(method: String!): Boolean!`
  - Auth required. Removes a linked method (`"password"` or `"google"`). Refuses to remove the last
    one (`AUTH-CANNOT-REMOVE-LAST-METHOD`); unknown kind → `AUTH-METHOD-UNKNOWN`; idempotent if absent.
- `deleteMyAccount: Boolean!`
  - Auth required. Self-service deletion. Blocked while the caller still owns atoms
    (`CR-15-OWNED-ATOMS-EXIST`) or is the sole Admin of a workspace (`CR-15-WORKSPACE-ADMIN-EXISTS`).

#### Mutations — Atoms

- `change(selector: Selector, inputs: [AtomInput]!, remark: String): [String]!`
  - Auth required.
  - Create mode: omit `selector`.
  - Update mode: provide `selector.uuid`.
  - In both modes, each `AtomInput` requires `labels`.
  - `remark` is optional. If provided, it is stored with the change event and visible in change history.
  - Returns the list of affected atom UUIDs.
- `destroy(selector: DestroySelector!): DestroyOutcome!`
  - Auth required.
  - Supports either `selector.uuids` or `selector.uuid` (single is normalized to `uuids` internally).
  - Returns a `DestroyOutcome`:
    - `requested: [String!]!` — UUIDs submitted for deletion.
    - `deleted: [String!]!` — UUIDs that were actually deleted.
    - `notFound: [String!]!` — UUIDs that were not deleted (not found or not owned by the caller).
  - No-op deletes (all UUIDs in `notFound`, empty `deleted`) do not raise errors.

#### Mutations — Access, Ownership & Workspaces

> **Principals are usernames / workspace keys, not UUIDs.** Sharing and ownership inputs take a
> human-readable `principal` (a **username** for `USER`, a **workspace key** for `WORKSPACE`). The
> backend resolves it to an internal id. An unknown principal → `CR-16-PRINCIPAL-UNKNOWN`.

- `shareAtom(atomUuid: ID!, principal: String!, principalType: PrincipalType!, level: AccessLevel!): Boolean!`
  - Auth required (owner-only). `principalType` is `USER` or `WORKSPACE`; `level` is `EDITOR` or `VIEWER`.
- `revokeAtomAccess(atomUuid: ID!, principal: String!, principalType: PrincipalType!): Boolean!`
  - Auth required (owner-only).
- `transferAtomOwnership(atomUuid: ID!, toUsername: String!): Boolean!`
  - Auth required (owner-only). Atomic single-owner handoff.
- `createWorkspace(key: String!, name: String!, description: String): WorkspaceOutput!`
- `updateWorkspace(uuid: ID!, name: String, description: String): WorkspaceOutput!`
- `dissolveWorkspace(uuid: ID!): Boolean!`
- `addWorkspaceMember(workspaceUuid: ID!, username: String!, role: WorkspaceRole!): Boolean!`
- `removeWorkspaceMember(workspaceUuid: ID!, username: String!): Boolean!`
- `updateWorkspaceMemberRole(workspaceUuid: ID!, username: String!, role: WorkspaceRole!): Boolean!`
  - All auth required. `WorkspaceRole` is `ADMIN`, `EDITOR`, or `VIEWER`. Workspace mutations are
    Admin-gated (with self-leave and a last-Admin invariant).

#### Mutations — Category Taxonomy

- `createCategoryDimension(key: String!, displayName: String!, description: String, parentDimensionKeys: [String!], childDimensionKeys: [String!]): CategoryDimensionOutput!`
- `createCategoryValue(key: String!, displayName: String!, description: String, dimensionKey: String!, parentValueKeys: [String!], childValueKeys: [String!]): CategoryValueOutput!`
- `updateCategoryDimension(key: String!, displayName: String, description: String): CategoryDimensionOutput!`
- `updateCategoryValue(key: String!, displayName: String, description: String): CategoryValueOutput!`
  - `key`/`dimensionKey` are immutable and are intentionally not update arguments.
- `connectCategoryDimensions(dimensionKey: String!, parentDimensionKeys: [String!], childDimensionKeys: [String!]): CategoryDimensionOutput!`
- `disconnectCategoryDimensions(dimensionKey: String!, parentDimensionKeys: [String!], childDimensionKeys: [String!]): CategoryDimensionOutput!`
- `connectCategoryValues(valueKey: String!, parentValueKeys: [String!], childValueKeys: [String!]): CategoryValueOutput!`
- `disconnectCategoryValues(valueKey: String!, parentValueKeys: [String!], childValueKeys: [String!]): CategoryValueOutput!`
- `deleteCategoryDimension(key: String!): Boolean!`
- `deleteCategoryValue(key: String!): Boolean!`
  - All auth required. A dimension may have at most one parent (`CAT-MULTIPLE-PARENTS-UNSUPPORTED`),
    cycles are rejected (`CAT-DIMENSION-CYCLE`), and a value's parent must comply with the dimension
    schema (`CAT-VALUE-PARENT-DIMENSION-MISMATCH`). Deletion is guarded
    (`CAT-DIMENSION-HAS-VALUES`/`-HAS-CHILDREN`, `CAT-VALUE-REFERENCED`/`-HAS-CHILDREN`).

#### Input Types (Current)

- `AtomInput`
  - `labels: [String!]!`
  - `bonds: [BondInput]`
  - `properties: PropertiesInput`
  - `categories: [CategoryAssignmentInput!]` — present (incl. `[]`) replaces all assignments; omitted
    leaves them unchanged (the `bonds` precedent).
- `BondInput`
  - `uuid: ID!`, `name: String!`, `direction: String!`
- `PropertiesInput`
  - `shellies: ShelliesInput` (`uuid` input only)
  - `nuclearies: NucleariesInput`
- `NucleariesInput`
  - `title`, `description`, `operation`, `constants`
  - `content: JSON` — accepts a string, number, JSON array (list atom), or null
  - `declaredType` (typed declaration input)
  - `typeMode` (`flexible` or `strict`)
- `CategoryAssignmentInput`
  - `valueKey: String!` — the dimension is derived from the value.
- `CategoryFilterInput`
  - `dimensionKey: String!`, `valueKeys: [String!]!`, `includeDescendants: Boolean`
  - AND across entries, OR within an entry's `valueKeys`. `includeDescendants: true` also matches
    atoms at any descendant value (via the value hierarchy).
- `Selector`
  - `labels`, `uuid`, `uuids`, `title`, `content`, `description`, `operation`, `constants`
  - Practical usage: `change` update path should use `selector.uuid`; `destroy` should use
    `selector.uuids` (or `selector.uuid` for a single delete).
- `DestroySelector`
  - `uuid`, `uuids`
- `WorkspaceSelector`
  - `uuid`, `key`
- `CategoryDimensionSelector`
  - `key`, `uuid`, `parentDimensionKey`, `isRoot`, `isEmpty`, `limit`, `offset`
- `CategoryValueSelector`
  - `key`, `uuid`, `dimensionKey`, `parentValueKey`, `isRoot`, `isUnused`, `limit`, `offset`
  - Boolean selectors are positive filters only: `true` narrows; `false`/absent is a no-op.

#### Output Typing Fields (Current)

`AtomOutput.properties.nuclearies` exposes:

- `title` (non-null), `content`, `description`, `operation`, `constants`
- `declaredType`, `effectiveType`, `typeMode`, `typeState`

#### Atom/Bond Output Fields (Current)

`AtomOutput` also exposes:

- `ownerUuid: ID!`
- `accessLevel: EffectiveAccessLevel!` — `OWNER`, `EDITOR`, or `VIEWER`
- `errorCode`
- `evaluationStatus`
- `cycleNodes`, `cycleEdges`
- `originNodeUuid`, `affectedNodeUuid`, `causes`
- `categories: [CategoryAssignmentOutput!]!` — each is `{ dimensionKey, valueKey }`

`BondOutput` exposes:

- `uuid`, `name`, `direction`
- `required` (nullable; present for relationship types that carry required/optional semantics)

#### Behavior and Constraints (Current)

- `operation` is represented as a GraphQL string field at the boundary.
- Canonical function-style operation payloads are supported by runtime behavior and are serialized at the boundary as string values.
- `OP_DEPENDENCY` bonds are system-managed; clients should not submit them directly.
- `change` requires `labels` in each input object, including update payloads.

---

## Authentication

Crystord uses **verify-first signup** and **revocable, expiring sessions**. There is no longer a
single `signup` call that immediately returns a token, and there is no permanent token.

### Sign up (two steps: verify the email, then create the account)

**Step 1 — request a code.** This emails a single-use 6-digit code to the address.

```graphql
mutation {
  beginSignup(email: "user@example.com")
}
```

Always returns `true` (it never reveals whether the email is already registered).

**Step 2 — complete signup** with the emailed code, a password, and a chosen username. Returns a
session token (the account is created already email-verified).

```graphql
mutation {
  completeSignup(
    email: "user@example.com"
    code: "123456"
    password: "correct-horse-battery"
    username: "demo.user"
  )
}
```

- Wrong or expired code → `SIGNUP-INVALID-OR-EXPIRED-CODE`.
- Invalid username → `USER-INVALID-USERNAME` (see [Username rules](#username-rules)).
- Weak password → `PASSWORD-TOO-SHORT` / `PASSWORD-TOO-LONG` / `PASSWORD-TOO-COMMON`.

### Sign in

```graphql
query {
  signin(
    email: "user@example.com"
    password: "correct-horse-battery"
  )
}
```

Returns a fresh session token. Too many failed attempts → `AUTH-RATE-LIMITED`.

### Google sign-in

```graphql
query {
  signinGoogle(idToken: "google-id-token")
}
```

- An **unknown** email creates a new verified, password-less account and returns a token.
- An **existing** account is signed in **only if Google is already linked**. If it is not linked,
  the API returns `AUTH-GOOGLE-NOT-LINKED` — the user must sign in another way and link Google
  deliberately with `linkGoogle`. (Google sign-in no longer silently links an existing account.)

The Google client ID is configured in the client application; the API does not expose it.

### Manage authentication methods

```graphql
# See your own account and which methods are linked
query { me { username email emailVerified authMethods } }

# Link Google to the signed-in account (verified Google email must match your account email)
mutation { linkGoogle(idToken: "google-id-token") }

# Set or replace your password (e.g. a Google-only account adding password sign-in)
mutation { setPassword(newPassword: "a-strong-new-password") }

# Remove a method (cannot remove your last one)
mutation { unlinkAuthMethod(method: "google") }
```

### Reset a forgotten password

```graphql
# Step 1 — email a reset token (always returns true)
mutation { requestPasswordReset(email: "user@example.com") }

# Step 2 — set a new password using the token from the email
mutation { confirmPasswordReset(token: "<token-from-email>", newPassword: "a-strong-new-password") }
```

Confirming a reset **revokes all existing sessions**, so the user must sign in again afterwards.

### Change the login email

```graphql
# Step 1 — email a code to the NEW address (authenticated)
mutation { requestEmailChange(newEmail: "new@example.com") }

# Step 2 — confirm with the code (authenticated). Other sessions are revoked; the current one stays.
mutation { confirmEmailChange(code: "123456") }
```

A target email already in use → `EMAIL-ALREADY-IN-USE`.

### End sessions

```graphql
mutation { logout }            # end the current session (the presented Bearer token)
mutation { revokeAllSessions } # sign out everywhere
```

### Username rules

A username (the public handle) must:

- be **3–30** characters,
- use only letters, digits, `.`, `_`, `-`,
- **start with a letter**,
- not start or end with a separator, and contain no consecutive separators,
- not be a reserved name (`admin`, `support`, `api`, `me`, `root`, `system`).

Uniqueness is case-insensitive; display casing is preserved. A violation raises
`USER-INVALID-USERNAME`.

### Password policy

- Minimum length **12** characters (length-based, NIST-aligned; no character-class requirements).
- Maximum **72 bytes** (bcrypt limit).
- Common passwords are rejected against a bundled denylist.
- Errors: `PASSWORD-TOO-SHORT`, `PASSWORD-TOO-LONG`, `PASSWORD-TOO-COMMON`.

### Rate limiting

The auth surface is rate-limited to resist brute force and abuse. Sign-in failures, repeated code
entries, and code-send actions are capped per email and per IP within a window; exceeding the cap
returns a generic `AUTH-RATE-LIMITED` (it does not reveal whether the email exists). Clients should
surface a "try again later" message and back off.

---

## Reading Data

### Retrieve one Atom by UUID

```graphql
query {
  retrieve(uuid: "1c7b2b3d-1111-2222-3333-444455556666") {
    labels
    ownerUuid
    accessLevel
    bonds {
      uuid
      name
      direction
      required
    }
    categories {
      dimensionKey
      valueKey
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

### Retrieve Atoms by category

```graphql
query {
  retrieve(categories: [
    { dimensionKey: "brand", valueKeys: ["mercedes", "tesla"], includeDescendants: true }
  ]) {
    properties { shellies { uuid } nuclearies { title } }
    categories { dimensionKey valueKey }
  }
}
```

AND across entries, OR within an entry's `valueKeys`. With `includeDescendants: true`, atoms tagged
at a descendant value also match.

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

### Create an Atom with category assignments

```graphql
mutation {
  change(
    inputs: [
      {
        labels: ["Car"]
        categories: [{ valueKey: "mercedes" }]
        properties: { nuclearies: { title: "My car" } }
      }
    ]
  )
}
```

`categories` replaces all current assignments on the atom; omit it to leave them unchanged; pass `[]`
to clear them. The dimension is derived from the value.

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
  ) {
    requested
    deleted
    notFound
  }
}
```

Use this when an Atom should be removed from the system.

---

## Access, Ownership & Sharing

Every atom has an **owner**. Operations are access-aware:

- `retrieve` returns atoms the caller owns or has been granted access to.
- `change` updates require Editor-or-higher access; `destroy` and grant management are owner-only.
- Each returned `AtomOutput` carries `ownerUuid` and the caller's `accessLevel` (`OWNER`/`EDITOR`/`VIEWER`).

You grant access by **username** (for a user) or **workspace key** (for a workspace):

```graphql
# Share an atom with another user as an editor
mutation {
  shareAtom(
    atomUuid: "1c7b2b3d-1111-2222-3333-444455556666"
    principal: "demo.user"
    principalType: USER
    level: EDITOR
  )
}

# Share with a whole workspace as viewers
mutation {
  shareAtom(
    atomUuid: "1c7b2b3d-1111-2222-3333-444455556666"
    principal: "marketing-team"
    principalType: WORKSPACE
    level: VIEWER
  )
}

# Revoke access
mutation {
  revokeAtomAccess(atomUuid: "...", principal: "demo.user", principalType: USER)
}

# Hand the atom to someone else entirely
mutation {
  transferAtomOwnership(atomUuid: "...", toUsername: "other.user")
}
```

An unknown principal raises `CR-16-PRINCIPAL-UNKNOWN`. Bonding to an atom you have no access to
hard-fails with `AU-UNAUTHORIZED`.

### Workspaces

Workspaces let a group of users share access. A workspace has a unique `key`, members with roles
(`ADMIN`/`EDITOR`/`VIEWER`), and is managed by its Admins.

```graphql
mutation { createWorkspace(key: "marketing-team", name: "Marketing", description: "Campaigns") {
  uuid key name memberCount
}}

mutation { addWorkspaceMember(workspaceUuid: "<ws-uuid>", username: "demo.user", role: EDITOR) }

query { listMyWorkspaces { uuid key name memberCount } }
```

When an atom is shared to a workspace, each member's effective access is the lower of the grant
level and their workspace role; the highest applicable grant wins across direct + workspace grants.

---

## Categories (Dimensions & Values)

Crystord's structured classification has two node kinds plus optional hierarchies:

- **Dimension** — a classification axis (e.g. `brand`). Dimensions can be nested under a parent
  dimension (single-parent tree for v1).
- **Value** — a value within a dimension (e.g. `mercedes` in `brand`). Values can be nested under a
  parent value (e.g. `sedan` under `car`).

An atom is classified by assigning it the **most specific value(s)** it belongs to (via
`AtomInput.categories`); broader dimensions/values are derived ancestors.

> This **replaces** the old Facet/Category model (`createFacet`, `createCategory`,
> `assignCategoryToFacet`, `retrieveFacets`, `retrieveCategories`, and the `IN_CATEGORY` bond), which
> was removed in schema `4.0.0`. Do not use any of those — they no longer exist.

**Working example — cars by brand:**

```graphql
# 1. Create a dimension (the axis)
mutation {
  createCategoryDimension(key: "brand", displayName: "Brand") {
    uuid key displayName parentDimensionKeys
  }
}

# 2. Create values within the dimension
mutation {
  createCategoryValue(key: "mercedes", displayName: "Mercedes", dimensionKey: "brand") {
    uuid key displayName dimensionKey parentValueKeys
  }
}

# 3. Classify an atom by assigning the value (NOT a bond)
mutation {
  change(inputs: [{
    labels: ["Car"]
    categories: [{ valueKey: "mercedes" }]
    properties: { nuclearies: { title: "My car" } }
  }])
}

# 4. Read the taxonomy
query {
  retrieveCategoryValues(selector: { dimensionKey: "brand" }) {
    uuid key displayName dimensionKey parentValueKeys
  }
}

# 5. Drill down: browse a dimension's roots, or a value's subtree
query {
  retrieveCategoryBrowse(dimensionKey: "brand") {
    value { key displayName }
    children { value { key displayName } atomCount }
    atoms { properties { shellies { uuid } nuclearies { title } } }
  }
}
```

**Rules and behavior:**
- `key` is unique and immutable; `dimensionKey` on a value is immutable. Duplicate → `CAT-DUPLICATE-KEY`.
- A dimension or value may have at most one parent (`CAT-MULTIPLE-PARENTS-UNSUPPORTED`); dimension
  cycles are rejected (`CAT-DIMENSION-CYCLE`).
- A value's parent must comply with the dimension schema → `CAT-VALUE-PARENT-DIMENSION-MISMATCH`.
- An atom is assigned the most specific value per dimension: assigning two values in the same
  dimension → `CAT-DUPLICATE-DIMENSION`; assigning an ancestor of an already-assigned value →
  `CAT-REDUNDANT-ANCESTOR`.
- Deletion is guarded: `CAT-DIMENSION-HAS-VALUES` / `CAT-DIMENSION-HAS-CHILDREN`,
  `CAT-VALUE-REFERENCED` / `CAT-VALUE-HAS-CHILDREN`.
- Pagination defaults to `limit=25`, `max limit=100`; over-limit → `OR-QUERY-LIMIT-EXCEEDED`.

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

1. Use **labels** to define quick, free-form business categories.
2. Use **Category Dimensions/Values** when you need stable, managed, hierarchical classification.
3. Use **title** as the human-readable name.
4. Use **description** for context.
5. Use **content** for the main value or body of information.
6. Use **bonds** whenever one item refers to or depends on another.
7. Use **uuid** whenever you need to update, connect, or delete a specific Atom.

---

## Example End-To-End Flow

A typical usage flow looks like this:

1. `beginSignup` then `completeSignup` (or `signin`) to get a session token.
2. `change` without a selector to create Atoms.
3. `change` with `bonds` to connect related Atoms.
4. `retrieve` by label, UUID, or category to read the data back.
5. `change` with a selector to update an existing Atom.
6. `shareAtom` to collaborate; `destroy` if an Atom is no longer needed.

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
- **Category Dimensions and Values** give it stable, managed, hierarchical classification.
- **Properties** hold its identity and content.
- **Bonds** connect it to other Atoms.
- **Sharing, ownership, and workspaces** control who can see and change each Atom.
- GraphQL gives you a simple way to create, retrieve, update, and delete those items.

If you are building a frontend or integrating from a non-coding workflow, the main thing to learn is not the internal implementation — it is the **meaning of the Atom model** and the small set of GraphQL operations available to work with it.
</content>
</invoke>
