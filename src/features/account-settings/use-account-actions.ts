import { useState, useCallback } from 'react'
import { useApolloClient } from '@apollo/client/react'
import {
  SET_PASSWORD_MUTATION,
  UNLINK_AUTH_METHOD_MUTATION,
  LINK_GOOGLE_MUTATION,
  REQUEST_EMAIL_CHANGE_MUTATION,
  CONFIRM_EMAIL_CHANGE_MUTATION,
  REVOKE_ALL_SESSIONS_MUTATION,
  DELETE_MY_ACCOUNT_MUTATION,
} from '../../api-contract/auth-operations'
import type {
  SetPasswordResponse,
  UnlinkAuthMethodResponse,
  LinkGoogleResponse,
  RequestEmailChangeResponse,
  ConfirmEmailChangeResponse,
  RevokeAllSessionsResponse,
  DeleteMyAccountResponse,
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
  /** Inline error for the new-email field (e.g. the target email is already in use). */
  emailError: string | null
  /** Inline error for the email-change confirmation code field. */
  codeError: string | null
  setPassword: (newPassword: string) => Promise<void>
  unlinkMethod: (method: string) => Promise<void>
  linkGoogle: (idToken: string) => Promise<void>
  /** Start an email change; resolves `true` when the code was sent to the new address. */
  requestEmailChange: (newEmail: string) => Promise<boolean>
  /** Confirm an email change with the emailed code; resolves `true` on success. */
  confirmEmailChange: (code: string) => Promise<boolean>
  /** Revoke every session ("sign out everywhere"); success ends the current session too. */
  signOutEverywhere: () => Promise<void>
  /** Delete the account; success ends the session, a block reason is surfaced as feedback. */
  deleteAccount: () => Promise<void>
  clearFeedback: () => void
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Account-management actions for the account-settings surface (REQ-FR-260066/067 / ADR-260058,
 * ADR-260056/057): set/replace password, unlink a method, link Google, change email, sign out
 * everywhere, and delete the account.
 *
 * `onChanged` lets the caller refresh `me` after a change that alters the overview (password/method/
 * email). `onSessionEnded` is invoked after the current session is intentionally ended
 * (`signOutEverywhere`/`deleteAccount` success) so the caller can route back to sign-in. Errors are
 * always interpreted by the central mapper — this module never parses raw codes itself.
 */
export function useAccountActions(onChanged: () => void, onSessionEnded: () => void): AccountActions {
  const client = useApolloClient()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<AccountFeedback | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

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

  const requestEmailChange = useCallback(async (newEmail: string): Promise<boolean> => {
    setFeedback(null)
    setEmailError(null)
    setCodeError(null)
    setPending(true)
    try {
      const { data } = await client.mutate<RequestEmailChangeResponse>({
        mutation: REQUEST_EMAIL_CHANGE_MUTATION, variables: { newEmail },
      })
      if (!data?.requestEmailChange) { setFeedback({ kind: 'error', message: 'Could not start the email change.' }); return false }
      setFeedback({ kind: 'success', message: `We sent a code to ${newEmail}. Enter it below to confirm.` })
      return true
    } catch (err) {
      const outcome = mapAuthError(messageOf(err))
      if (outcome.field === 'email') setEmailError(outcome.message)
      else setFeedback({ kind: 'error', message: outcome.code ? outcome.message : 'Could not start the email change.' })
      return false
    } finally {
      setPending(false)
    }
  }, [client])

  const confirmEmailChange = useCallback(async (code: string): Promise<boolean> => {
    setFeedback(null)
    setCodeError(null)
    setEmailError(null)
    setPending(true)
    try {
      const { data } = await client.mutate<ConfirmEmailChangeResponse>({
        mutation: CONFIRM_EMAIL_CHANGE_MUTATION, variables: { code },
      })
      if (!data?.confirmEmailChange) { setFeedback({ kind: 'error', message: 'Could not confirm the email change.' }); return false }
      setFeedback({ kind: 'success', message: 'Email updated.' })
      onChanged()
      return true
    } catch (err) {
      const outcome = mapAuthError(messageOf(err))
      if (outcome.field === 'code') setCodeError(outcome.message)
      else setFeedback({ kind: 'error', message: outcome.code ? outcome.message : 'Could not confirm the email change.' })
      return false
    } finally {
      setPending(false)
    }
  }, [client, onChanged])

  const signOutEverywhere = useCallback(async () => {
    setFeedback(null)
    setPending(true)
    try {
      const { data } = await client.mutate<RevokeAllSessionsResponse>({ mutation: REVOKE_ALL_SESSIONS_MUTATION })
      if (!data?.revokeAllSessions) { setFeedback({ kind: 'error', message: 'Could not sign out everywhere.' }); return }
      onSessionEnded()
    } catch (err) {
      const outcome = mapAuthError(messageOf(err))
      setFeedback({ kind: 'error', message: outcome.code ? outcome.message : 'Could not sign out everywhere.' })
    } finally {
      setPending(false)
    }
  }, [client, onSessionEnded])

  const deleteAccount = useCallback(async () => {
    setFeedback(null)
    setPending(true)
    try {
      const { data } = await client.mutate<DeleteMyAccountResponse>({ mutation: DELETE_MY_ACCOUNT_MUTATION })
      if (!data?.deleteMyAccount) { setFeedback({ kind: 'error', message: 'Could not delete your account.' }); return }
      onSessionEnded()
    } catch (err) {
      const outcome = mapAuthError(messageOf(err))
      setFeedback({ kind: 'error', message: outcome.code ? outcome.message : 'Could not delete your account.' })
    } finally {
      setPending(false)
    }
  }, [client, onSessionEnded])

  const clearFeedback = useCallback(() => {
    setFeedback(null)
    setPasswordError(null)
    setEmailError(null)
    setCodeError(null)
  }, [])

  return {
    pending, feedback, passwordError, emailError, codeError,
    setPassword, unlinkMethod, linkGoogle,
    requestEmailChange, confirmEmailChange, signOutEverywhere, deleteAccount,
    clearFeedback,
  }
}
