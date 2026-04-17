import type { ApolloClient } from '@apollo/client'
import {
  SCHEMA_INFO_QUERY,
  checkSchemaCompatibility,
} from '../api-contract'
import type { SchemaInfoResponse, CompatibilityResult } from '../api-contract'

export async function runStartupCompatibilityCheck(
  client: ApolloClient,
  supportedRange: string,
): Promise<CompatibilityResult> {
  const { data } = await client.query<SchemaInfoResponse>({
    query: SCHEMA_INFO_QUERY,
    fetchPolicy: 'network-only',
  })

  if (!data) {
    throw new Error('schemaInfo query returned no data.')
  }

  return checkSchemaCompatibility(data.schemaInfo, supportedRange)
}
