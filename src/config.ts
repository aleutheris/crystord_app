export interface AppConfig {
  graphqlEndpoint: string
  supportedSchemaRange: string
  googleClientId?: string
}

export async function loadConfig(): Promise<AppConfig> {
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`)
  if (!response.ok) {
    throw new Error(`Failed to load config.json: ${response.status}`)
  }
  const data = await response.json() as Record<string, unknown>

  const graphqlEndpoint = data['graphqlEndpoint']
  if (!graphqlEndpoint || typeof graphqlEndpoint !== 'string') {
    throw new Error('config.json: graphqlEndpoint is not configured.')
  }

  const supportedSchemaRange = data['supportedSchemaRange']
  if (!supportedSchemaRange || typeof supportedSchemaRange !== 'string') {
    throw new Error('config.json: supportedSchemaRange is not configured.')
  }

  const googleClientId = typeof data['googleClientId'] === 'string' ? data['googleClientId'] : undefined

  return { graphqlEndpoint, supportedSchemaRange, googleClientId }
}
