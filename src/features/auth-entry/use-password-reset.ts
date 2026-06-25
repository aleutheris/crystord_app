import { useState, useCallback } from 'react'
import type { ApolloClient } from '@apollo/client'
import {
  REQUEST_PASSWORD_RESET_MUTATION,
  CONFIRM_PASSWORD_RESET_MUTATION,
} from '../../api-contract/auth-operations'
import type {
  RequestPasswordResetResponse,
  ConfirmPasswordResetResponse,
} from '../../api-contract/auth-operations'
import { mapAuthError } from '../../api-contract/error-codes'
import { validatePassword } from '../../api-contract/auth-validation'

export type ResetStep = 'request' | 'confirm'

export interface ResetFieldErrors {
  email?: string
  token?: string
  newPassword?: string
}

export interface PasswordResetController {
  step: ResetStep
  email: string
  token: string
  newPassword: string
  formError: string | null
  fieldErrors: ResetFieldErrors
  loading: boolean
  setEmail: (v: string) => void
  setToken: (v: string) => void
  setNewPassword: (v: string) => void
  submitRequest: () => Promise<void>
  submitConfirm: () => Promise<void>
  back: () => void
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Client-side validation for the confirm step; returns per-field errors (empty when all valid). */
export function confirmFieldErrors(token: string, newPassword: string): ResetFieldErrors {
  const errors: ResetFieldErrors = {}
  if (!token) errors.token = 'Enter the code we emailed you.'
  const passwordError = validatePassword(newPassword)
  if (passwordError) errors.newPassword = passwordError
  return errors
}

/**
 * Owns the public self-service password-reset flow (REQ-FR-260065 / ADR-260058): email →
 * `requestPasswordReset` (anti-enumeration, always advances), then token + new password →
 * `confirmPasswordReset`. On success `onComplete` routes back to sign-in (reset revokes all sessions).
 */
export function usePasswordReset(
  client: ApolloClient,
  onComplete: () => void,
): PasswordResetController {
  const [step, setStep] = useState<ResetStep>('request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({})
  const [loading, setLoading] = useState(false)

  const reportError = useCallback((message: string) => {
    const outcome = mapAuthError(message)
    if (outcome.kind === 'field' && outcome.field === 'password') {
      setFieldErrors((prev) => ({ ...prev, newPassword: outcome.message }))
    } else {
      setFormError(outcome.message)
    }
  }, [])

  const submitRequest = useCallback(async () => {
    setFormError(null)
    if (!email) { setFieldErrors({ email: 'Enter your email address.' }); return }
    setFieldErrors({})
    setLoading(true)
    try {
      // Always advance — the server returns success regardless of whether the email is registered.
      await client.mutate<RequestPasswordResetResponse>({
        mutation: REQUEST_PASSWORD_RESET_MUTATION,
        variables: { email },
      })
      setStep('confirm')
    } catch (err) {
      reportError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [client, email, reportError])

  const submitConfirm = useCallback(async () => {
    setFormError(null)
    const errors = confirmFieldErrors(token, newPassword)
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setFieldErrors({})
    setLoading(true)
    try {
      const { data } = await client.mutate<ConfirmPasswordResetResponse>({
        mutation: CONFIRM_PASSWORD_RESET_MUTATION,
        variables: { token, newPassword },
      })
      if (!data?.confirmPasswordReset) { setFormError('Password reset failed. Please try again.'); return }
      onComplete()
    } catch (err) {
      reportError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [client, token, newPassword, onComplete, reportError])

  const back = useCallback(() => {
    setStep('request')
    setFormError(null)
    setFieldErrors({})
    setToken('')
    setNewPassword('')
  }, [])

  return {
    step, email, token, newPassword, formError, fieldErrors, loading,
    setEmail, setToken, setNewPassword, submitRequest, submitConfirm, back,
  }
}
