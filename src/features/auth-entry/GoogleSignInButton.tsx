import { useEffect, useRef } from 'react'
import { type ApolloClient } from '@apollo/client'
import { SIGN_IN_GOOGLE_QUERY } from '../../api-contract/auth-queries'
import type { SignInGoogleResponse } from '../../api-contract/auth-queries'

interface GoogleSignInButtonProps {
  client: ApolloClient
  googleClientId: string
  onSuccess: (token: string) => void
  onError: (message: string) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void
          renderButton: (element: HTMLElement, options: { theme: string; size: string }) => void
        }
      }
    }
  }
}

export function GoogleSignInButton({ client, googleClientId, onSuccess, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function initGIS() {
      if (!window.google || !containerRef.current) return

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            const { data } = await client.query<SignInGoogleResponse>({
              query: SIGN_IN_GOOGLE_QUERY,
              variables: { idToken: response.credential },
              fetchPolicy: 'network-only',
            })
            if (!data?.signinGoogle) {
              onError('Google sign-in failed: no token returned.')
              return
            }
            onSuccess(data.signinGoogle)
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Google sign-in failed.')
          }
        },
      })

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
      })
    }

    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]')
    if (existing) {
      initGIS()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = initGIS
    document.head.appendChild(script)
  }, [client, googleClientId, onSuccess, onError])

  return <div ref={containerRef} />
}
