import { useState, useEffect } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { ME_QUERY } from '../../api-contract'
import type { AccountInfo, MeResponse } from '../../api-contract'

export interface AccountInfoState {
  account: AccountInfo | null
  loading: boolean
  error: string | null
}

/**
 * Fetches the signed-in user's own account overview via `me` (REQ-FR-260067 / ADR-260058) for the
 * account-settings surface. Session expiry is handled globally (the Apollo error link), so this just
 * surfaces a generic message on any other failure.
 */
export function useAccountInfo(): AccountInfoState {
  const client = useApolloClient()
  const [state, setState] = useState<AccountInfoState>({ account: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    client
      .query<MeResponse>({ query: ME_QUERY, fetchPolicy: 'network-only' })
      .then(({ data }) => {
        if (cancelled) return
        if (data?.me) setState({ account: data.me, loading: false, error: null })
        else setState({ account: null, loading: false, error: 'Could not load your account details.' })
      })
      .catch(() => {
        if (cancelled) return
        setState({ account: null, loading: false, error: 'Could not load your account details.' })
      })
    return () => { cancelled = true }
  }, [client])

  return state
}
