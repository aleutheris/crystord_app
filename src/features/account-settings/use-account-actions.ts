import { useState, useCallback } from 'react'
import { useApolloClient } from '@apollo/client/react'
import {
  SET_PASSWORD_MUTATION,
  UNLINK_AUTH_METHOD_MUTATION,
  LINK_GOOGLE_MUTATION,
} from '../../api-contract/auth-operations'
import type {
  SetPasswordResponse,
  UnlinkAuthMethodResponse,
  LinkGoogleResponse,
} from '../../api-contract/auth-operations'
import { mapAuthError } from '../../api-contract/error-codes'
import { validatePassword } from '../../api-contract/auth-validation'

export interface AccountFeedback {
  kind: 'success' | 'error'
  message: string
}

export interface AccountActions {
  pending: boolean
  feedback: AccountFeedback | null
  /** Inline error for the new-password field (client rule or server PASSWORD-* code). */
  passwordError: string | null
  setPassword: (newPassword: string) => Promise<void>
  unlinkMethod: (method: string) => Promise<void>
  linkGoogle: (idToken: string) => Promise<void>
  clearFeedback: () => void
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Auth-method management actions for the account-settings surface (REQ-FR-260066/067 / ADR-260058):
 * set/replace password, unlink a method (server blocks the last one), and link Google. Each success
 * calls `onChanged` so the caller can refresh `me`. Errors are interpreted by the central mapper.
 */
export function useAccountActions(onChanged: () => void): AccountActions {
  const client = useApolloClient()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<AccountFeedback | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const setPassword = useCallback(async (newPassword: string) => {
    setFeedback(null)
    setPasswordError(null)
    const invalid = validatePassword(newPassword)
    if (invalid) { setPasswordError(invalid); return }
    setPending(true)
    try {
      const { data } = await client.mutate<SetPasswordResponse>({
        mutation: SET_PASSWORD_MUTATION, variables: { newPassword },
      })
      if (!data?.setPassword) { setFeedback({ kind: 'error', message: 'Could not update your password.' }); return }
      setFeedback({ kind: 'success', message: 'Password updated.' })
      onChanged()
    } catch (err) {
      const outcome = mapAuthError(messageOf(err))
      if (outcome.field === 'password') setPasswordError(outcome.message)
      else setFeedback({ kind: 'error', message: outcome.code ? outcome.message : 'Could not update your password.' })
    } finally {
      setPending(false)
    }
  }, [client, onChanged])

  const unlinkMethod = useCallback(async (method: string) => {
    setFeedback(null)
    setPending(true)
    try {
      const { data } = await client.mutate<UnlinkAuthMethodResponse>({
        mutation: UNLINK_AUTH_METHOD_MUTATION, variables: { method },
      })
      if (!data?.unlinkAuthMethod) { setFeedback({ kind: 'error', message: 'Could not remove that method.' }); return }
      setFeedback({ kind: 'success', message: `Removed ${method} sign-in.` })
      onChanged()
    } catch (err) {
      const outcome = mapAuthError(messageOf(err))
      setFeedback({ kind: 'error', message: outcome.code ? outcome.message : 'Could not remove that method.' })
    } finally {
      setPending(false)
    }
  }, [client, onChanged])

  const linkGoogle = useCallback(async (idToken: string) => {
    setFeedback(null)
    setPending(true)
    try {
      const { data } = await client.mutate<LinkGoogleResponse>({
        mutation: LINK_GOOGLE_MUTATION, variables: { idToken },
      })
      if (!data?.linkGoogle) { setFeedback({ kind: 'error', message: 'Could not link Google.' }); return }
      setFeedback({ kind: 'success', message: 'Google linked.' })
      onChanged()
    } catch (err) {
      const outcome = mapAuthError(messageOf(err))
      setFeedback({ kind: 'error', message: outcome.code ? outcome.message : 'Could not link Google.' })
    } finally {
      setPending(false)
    }
  }, [client, onChanged])

  const clearFeedback = useCallback(() => {
    setFeedback(null)
    setPasswordError(null)
  }, [])

  return { pending, feedback, passwordError, setPassword, unlinkMethod, linkGoogle, clearFeedback }
}
