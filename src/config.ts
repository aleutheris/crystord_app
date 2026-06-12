export interface AppConfig {
  graphqlEndpoint: string
  backendSchemaRange: string
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

  const backendSchemaRange = data['backendSchemaRange']
  if (!backendSchemaRange || typeof backendSchemaRange !== 'string') {
    throw new Error('config.json: backendSchemaRange is not configured.')
  }

  const googleClientId = typeof data['googleClientId'] === 'string' ? data['googleClientId'] : undefined

  return { graphqlEndpoint, backendSchemaRange, googleClientId }
}
