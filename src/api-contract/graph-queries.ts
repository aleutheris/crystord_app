import { gql } from '@apollo/client'

export const LIST_LABELS_QUERY = gql`
  query ListLabels($prefix: String!) {
    list_labels(labels_prefix: $prefix)
  }
`

export const RETRIEVE_QUERY = gql`
  query RetrieveAtoms($labels: [String!], $uuid: String) {
    retrieve(labels: $labels, uuid: $uuid) {
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
`

export const CREATE_ATOMS_MUTATION = gql`
  mutation CreateAtoms($inputs: [AtomInput!]!) {
    change(inputs: $inputs)
  }
`

export const UPDATE_ATOM_MUTATION = gql`
  mutation UpdateAtom($selector: SelectorInput!, $inputs: [AtomInput!]!) {
    change(selector: $selector, inputs: $inputs)
  }
`

export const DESTROY_ATOMS_MUTATION = gql`
  mutation DestroyAtoms($selector: SelectorInput!) {
    destroy(selector: $selector)
  }
`

export interface AtomBond {
  uuid: string
  name: string
  direction: string
}

export interface AtomNuclearies {
  title: string
  description: string
  content: string
  operation: string | null
  constants: Record<string, unknown> | null
}

export interface Atom {
  labels: string[]
  bonds: AtomBond[]
  properties: {
    shellies: { uuid: string }
    nuclearies: AtomNuclearies
  }
}

export interface RetrieveResponse {
  retrieve: Atom[]
}

export interface ListLabelsResponse {
  list_labels: string[]
}
