import { useEffect, useState } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import type { ApolloClient } from '@apollo/client'
import { createApolloClient } from './api-contract'
import type { CompatibilityResult } from './api-contract'
import { runStartupCompatibilityCheck } from './bootstrap'
import { getConfig } from './config'
import { LoadingScreen } from './ui-shell/LoadingScreen'
import { SchemaErrorScreen } from './ui-shell/SchemaErrorScreen'
import { StartupErrorScreen } from './ui-shell/StartupErrorScreen'

type StartupState =
  | { phase: 'loading' }
  | { phase: 'compatible'; client: ApolloClient }
  | { phase: 'incompatible'; result: CompatibilityResult }
  | { phase: 'error'; message: string }

export default function App() {
  const [state, setState] = useState<StartupState>({ phase: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const config = getConfig()
        const client = createApolloClient(config.graphqlEndpoint)
        const result = await runStartupCompatibilityCheck(client, config.supportedSchemaRange)

        if (cancelled) return

        if (result.compatible) {
          setState({ phase: 'compatible', client })
        } else {
          setState({ phase: 'incompatible', result })
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Unknown startup error'
        setState({ phase: 'error', message })
      }
    }

    void bootstrap()
    return () => { cancelled = true }
  }, [])

  switch (state.phase) {
    case 'loading':
      return <LoadingScreen />
    case 'incompatible':
      return (
        <SchemaErrorScreen
          schemaVersion={state.result.schemaVersion}
          supportedRange={state.result.supportedRange}
          message={state.result.message}
        />
      )
    case 'error':
      return <StartupErrorScreen error={state.message} />
    case 'compatible':
      return (
        <ApolloProvider client={state.client}>
          <div style={{ padding: '2rem' }}>
            <h1>Crystord</h1>
            <p>Schema compatible — workspace ready.</p>
          </div>
        </ApolloProvider>
      )
  }
}
