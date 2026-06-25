import { useState, useEffect, useRef, useCallback } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { ME_QUERY } from '../../api-contract'
import type { AccountInfo, MeResponse } from '../../api-contract'

export interface AccountInfoState {
  account: AccountInfo | null
  loading: boolean
  error: string | null
  /** Re-fetch `me` (e.g. after an account action changes the linked methods). Silent — no spinner. */
  refetch: () => void
}

/**
 * Fetches the signed-in user's own account overview via `me` (REQ-FR-260067 / ADR-260058) for the
 * account-settings surface, and re-fetches on demand. State is only updated from the query callbacks
 * (never synchronously in the mount effect); session expiry is handled globally by the Apollo error
 * link, so any other failure surfaces a generic message.
 */
export function useAccountInfo(): AccountInfoState {
  const client = useApolloClient()
  const mountedRef = useRef(true)
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchMe = useCallback(() => {
    client
      .query<MeResponse>({ query: ME_QUERY, fetchPolicy: 'network-only' })
      .then(({ data }) => {
        if (!mountedRef.current) return
        if (data?.me) { setAccount(data.me); setError(null) }
        else setError('Could not load your account details.')
        setLoading(false)
      })
      .catch(() => {
        if (!mountedRef.current) return
        setError('Could not load your account details.')
        setLoading(false)
      })
  }, [client])

  useEffect(() => { fetchMe() }, [fetchMe])

  return { account, loading, error, refetch: fetchMe }
}
