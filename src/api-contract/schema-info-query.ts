import { gql } from '@apollo/client'

export const SCHEMA_INFO_QUERY = gql`
  query StartupSchemaInfo {
    schemaInfo {
      schemaVersion
      schemaHash
      releasedAt
    }
  }
`

export interface SchemaInfo {
  schemaVersion: string
  schemaHash: string
  releasedAt: string
}

export interface SchemaInfoResponse {
  schemaInfo: SchemaInfo
}
