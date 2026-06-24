import { useState, useCallback, useEffect } from 'react'
import type { ApolloClient } from '@apollo/client'
import {
  BEGIN_SIGNUP_MUTATION,
  COMPLETE_SIGNUP_MUTATION,
} from '../../api-contract/auth-operations'
import type {
  BeginSignupResponse,
  CompleteSignupResponse,
} from '../../api-contract/auth-operations'
import { mapAuthError } from '../../api-contract/error-codes'
import { validateUsername, validatePassword } from '../../api-contract/auth-validation'

/** Seconds the user must wait before the verification code can be re-sent (REQ-FR-260063). */
export const RESEND_COOLDOWN_SECONDS = 45

export type SignUpStep = 'email' | 'verify'

export interface SignUpFieldErrors {
  email?: string
  code?: string
  username?: string
  password?: string
}

export interface SignUpController {
  step: SignUpStep
  email: string
  code: string
  username: string
  password: string
  formError: string | null
  fieldErrors: SignUpFieldErrors
  loading: boolean
  resendCooldown: number
  setEmail: (v: string) => void
  setCode: (v: string) => void
  setUsername: (v: string) => void
  setPassword: (v: string) => void
  submitEmail: () => Promise<void>
  submitVerify: () => Promise<void>
  resend: () => Promise<void>
  back: () => void
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Client-side validation for the verify step; returns the per-field errors (empty when all valid). */
export function verifyFieldErrors(code: string, username: string, password: string): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {}
  if (!code) errors.code = 'Enter the 6-digit code we emailed you.'
  const usernameError = validateUsername(username)
  if (usernameError) errors.username = usernameError
  const passwordError = validatePassword(password)
  if (passwordError) errors.password = passwordError
  return errors
}

/**
 * Owns the verify-first sign-up flow (REQ-FR-260063 / ADR-260055): email → `beginSignup`, then
 * code + username + password → `completeSignup`. Errors are interpreted by the central mapper
 * (ADR-260057): field-level for username/password, form-level for code/account/rate-limit.
 */
export function useSignUp(
  client: ApolloClient,
  onSuccess: (token: string) => void,
): SignUpController {
  const [step, setStep] = useState<SignUpStep>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const reportError = useCallback((message: string) => {
    const outcome = mapAuthError(message)
    if (outcome.kind === 'field' && outcome.field) {
      setFieldErrors((prev) => ({ ...prev, [outcome.field as keyof SignUpFieldErrors]: outcome.message }))
    } else {
      setFormError(outcome.message)
    }
  }, [])

  const requestCode = useCallback(async () => {
    // beginSignup always returns true (anti-enumeration) — advance regardless of the email's status.
    await client.mutate<BeginSignupResponse>({ mutation: BEGIN_SIGNUP_MUTATION, variables: { email } })
  }, [client, email])

  const submitEmail = useCallback(async () => {
    setFormError(null)
    if (!email) { setFieldErrors({ email: 'Enter your email address.' }); return }
    setFieldErrors({})
    setLoading(true)
    try {
      await requestCode()
      setStep('verify')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      reportError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [email, requestCode, reportError])

  const submitVerify = useCallback(async () => {
    setFormError(null)
    const errors = verifyFieldErrors(code, username, password)
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setFieldErrors({})
    setLoading(true)
    try {
      const { data } = await client.mutate<CompleteSignupResponse>({
        mutation: COMPLETE_SIGNUP_MUTATION,
        variables: { email, code, password, username },
      })
      if (!data?.completeSignup) { setFormError('Sign-up failed: no token returned.'); return }
      onSuccess(data.completeSignup)
    } catch (err) {
      reportError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [client, email, code, username, password, onSuccess, reportError])

  const resend = useCallback(async () => {
    if (resendCooldown > 0) return
    setFormError(null)
    try {
      await requestCode()
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      reportError(messageOf(err))
    }
  }, [resendCooldown, requestCode, reportError])

  const back = useCallback(() => {
    setStep('email')
    setFormError(null)
    setFieldErrors({})
    // Drop the stale verify-step inputs — a different email means a new code.
    setCode('')
    setUsername('')
    setPassword('')
  }, [])

  return {
    step, email, code, username, password, formError, fieldErrors, loading, resendCooldown,
    setEmail, setCode, setUsername, setPassword, submitEmail, submitVerify, resend, back,
  }
}
