import { type ApolloClient } from '@apollo/client'
import { SIGN_IN_GOOGLE_QUERY } from '../../api-contract/auth-queries'
import type { SignInGoogleResponse } from '../../api-contract/auth-queries'
import { GoogleCredentialButton } from '../../ui-primitives/buttons'

interface GoogleSignInButtonProps {
  client: ApolloClient
  googleClientId: string
  onSuccess: (token: string) => void
  onError: (message: string) => void
}

/**
 * Google sign-in: renders the shared {@link GoogleCredentialButton} (BI-260065) and exchanges the GIS
 * ID token for a session via `signinGoogle`. The GIS plumbing lives in the shared primitive; this
 * wrapper owns only the sign-in query and success/error routing.
 */
export function GoogleSignInButton({ client, googleClientId, onSuccess, onError }: GoogleSignInButtonProps) {
  async function handleCredential(idToken: string) {
    try {
      const { data } = await client.query<SignInGoogleResponse>({
        query: SIGN_IN_GOOGLE_QUERY,
        variables: { idToken },
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
  }

  return <GoogleCredentialButton googleClientId={googleClientId} onCredential={handleCredential} buttonType="icon" />
}
