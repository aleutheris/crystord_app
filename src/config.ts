export function getConfig() {
  const graphqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT
  if (!graphqlEndpoint || typeof graphqlEndpoint !== 'string') {
    throw new Error('VITE_GRAPHQL_ENDPOINT is not configured.')
  }

  const supportedSchemaRange = import.meta.env.VITE_SUPPORTED_SCHEMA_RANGE
  if (!supportedSchemaRange || typeof supportedSchemaRange !== 'string') {
    throw new Error('VITE_SUPPORTED_SCHEMA_RANGE is not configured.')
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  return { graphqlEndpoint, supportedSchemaRange, googleClientId } as const
}
