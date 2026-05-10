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
| `retrieve` | Query | Read Atoms by UUID or by labels |
| `list_labels` | Query | List available labels starting with a prefix |
| `change` | Mutation | Create new Atoms or update existing ones |
| `destroy` | Mutation | Delete Atoms |

> Important: `change` is the main write operation. It is used both to **create** and to **update** data.

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
  list_labels(labels_prefix: "Pro")
}
```

This is useful for building pickers, filters, or autocomplete interfaces.

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

## When To Use `operation` and `constants`

Most users can ignore these fields at first.

They are helpful when the content of one Atom should be **derived** from other information instead of being entered manually.
For example, a value might be calculated from related Atoms or from fixed constant values.

If you do not need calculated behavior yet, it is fine to leave:
- `operation` empty,
- `constants` empty.

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

## Final Takeaway

Crystord is best understood as a way to manage **connected business information**.

- An **Atom** is one meaningful unit of data.
- **Labels** classify it.
- **Properties** hold its identity and content.
- **Bonds** connect it to other Atoms.
- GraphQL gives you a simple way to create, retrieve, update, and delete those items.

If you are building a frontend or integrating from a non-coding workflow, the main thing to learn is not the internal implementation — it is the **meaning of the Atom model** and the small set of GraphQL operations available to work with it.
