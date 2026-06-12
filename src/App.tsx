import { useEffect, useState } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import { type ApolloClient } from '@apollo/client'
import { createApolloClient } from './api-contract'
import type { CompatibilityResult } from './api-contract'
import { runStartupCompatibilityCheck } from './bootstrap'
import { loadConfig } from './config'
import { ThemeProvider } from './styles/ThemeProvider'
import { AuthProvider, useAuth, SignInPage } from './features/auth-entry'
import { LoadingScreen } from './ui-shell/LoadingScreen'
import { SchemaErrorScreen } from './ui-shell/SchemaErrorScreen'
import { StartupErrorScreen } from './ui-shell/StartupErrorScreen'
import { WorkspaceShell } from './ui-shell/WorkspaceShell'

type StartupState =
  | { phase: 'loading' }
  | { phase: 'compatible'; client: ApolloClient; googleClientId?: string }
  | { phase: 'incompatible'; result: CompatibilityResult }
  | { phase: 'error'; message: string }

interface AppContentProps {
  client: ApolloClient
  googleClientId?: string
}

function AppContent({ client, googleClientId }: AppContentProps) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <SignInPage client={client} googleClientId={googleClientId} />
  }

  return <WorkspaceShell />
}

export default function App() {
  const [state, setState] = useState<StartupState>({ phase: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const config = await loadConfig()
        const client = createApolloClient(config.graphqlEndpoint)
        const result = await runStartupCompatibilityCheck(client, config.backendSchemaRange)

        if (cancelled) return

        if (result.compatible) {
          setState({ phase: 'compatible', client, googleClientId: config.googleClientId })
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
        <ThemeProvider>
          <ApolloProvider client={state.client}>
            <AuthProvider>
              <AppContent client={state.client} googleClientId={state.googleClientId} />
            </AuthProvider>
          </ApolloProvider>
        </ThemeProvider>
      )
  }
}
