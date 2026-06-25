import { useCallback } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { LOGOUT_MUTATION } from '../../api-contract/auth-operations'
import { useAuth } from './AuthProvider'

/**
 * User-initiated logout (REQ-FR-260064 / ADR-260056): fire-and-forget the server-side `logout`
 * mutation to revoke the session, then clear local auth state — regardless of whether the network
 * call succeeds.
 *
 * Session *expiry* is handled separately (the Apollo error link → `signOut`): it clears local state
 * without calling `logout`, because the session is already gone server-side.
 */
export function useLogout(): () => void {
  const client = useApolloClient()
  const { signOut } = useAuth()
  return useCallback(() => {
    void client.mutate({ mutation: LOGOUT_MUTATION }).catch(() => { /* best-effort revocation */ })
    signOut()
  }, [client, signOut])
}
