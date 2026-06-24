import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ApolloClient } from '@apollo/client'
import { useSignUp, verifyFieldErrors, RESEND_COOLDOWN_SECONDS } from './use-sign-up'

const VALID_USERNAME = 'demo.user'
const VALID_PASSWORD = 'correct horse battery'

function makeClient(mutate: ReturnType<typeof vi.fn>): ApolloClient {
  return { mutate } as unknown as ApolloClient
}

function fillVerify(result: { current: ReturnType<typeof useSignUp> }) {
  act(() => {
    result.current.setEmail('user@example.com')
    result.current.setCode('123456')
    result.current.setUsername(VALID_USERNAME)
    result.current.setPassword(VALID_PASSWORD)
  })
}

describe('verifyFieldErrors', () => {
  it('flags an empty code', () => {
    expect(verifyFieldErrors('', VALID_USERNAME, VALID_PASSWORD).code).toBeTruthy()
  })
  it('flags an invalid username and weak password', () => {
    const errors = verifyFieldErrors('123456', 'ab', 'short')
    expect(errors.username).toBeTruthy()
    expect(errors.password).toBeTruthy()
  })
  it('returns no errors when all valid', () => {
    expect(verifyFieldErrors('123456', VALID_USERNAME, VALID_PASSWORD)).toEqual({})
  })
})

describe('useSignUp — email step', () => {
  it('starts on the email step with empty fields', () => {
    const { result } = renderHook(() => useSignUp(makeClient(vi.fn()), vi.fn()))
    expect(result.current.step).toBe('email')
    expect(result.current.email).toBe('')
    expect(result.current.resendCooldown).toBe(0)
  })

  it('blocks an empty email without calling the backend', async () => {
    const mutate = vi.fn()
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    await act(async () => { await result.current.submitEmail() })
    expect(result.current.fieldErrors.email).toBeTruthy()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('calls beginSignup and advances to the verify step with a cooldown', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { beginSignup: true } })
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitEmail() })
    expect(mutate).toHaveBeenCalledOnce()
    expect(result.current.step).toBe('verify')
    expect(result.current.resendCooldown).toBe(RESEND_COOLDOWN_SECONDS)
  })

  it('surfaces a rate-limit as a form error and stays on the email step', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitEmail() })
    expect(result.current.formError).toMatch(/too many attempts/i)
    expect(result.current.step).toBe('email')
  })

  it('handles a non-Error rejection via the unknown fallback', async () => {
    const mutate = vi.fn().mockRejectedValue('boom')
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitEmail() })
    expect(result.current.formError).toBeTruthy()
  })
})

describe('useSignUp — verify step', () => {
  it('blocks invalid client-side fields without calling completeSignup', async () => {
    const mutate = vi.fn()
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    await act(async () => { await result.current.submitVerify() })
    expect(result.current.fieldErrors.code).toBeTruthy()
    expect(result.current.fieldErrors.username).toBeTruthy()
    expect(result.current.fieldErrors.password).toBeTruthy()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('completes sign-up and reports the token on success', async () => {
    const onSuccess = vi.fn()
    const mutate = vi.fn().mockResolvedValue({ data: { completeSignup: 'tok-xyz' } })
    const { result } = renderHook(() => useSignUp(makeClient(mutate), onSuccess))
    fillVerify(result)
    await act(async () => { await result.current.submitVerify() })
    expect(mutate.mock.calls[0]![0].variables).toEqual({
      email: 'user@example.com', code: '123456', password: VALID_PASSWORD, username: VALID_USERNAME,
    })
    expect(onSuccess).toHaveBeenCalledWith('tok-xyz')
  })

  it('shows a form error when no token is returned', async () => {
    const onSuccess = vi.fn()
    const mutate = vi.fn().mockResolvedValue({ data: { completeSignup: '' } })
    const { result } = renderHook(() => useSignUp(makeClient(mutate), onSuccess))
    fillVerify(result)
    await act(async () => { await result.current.submitVerify() })
    expect(result.current.formError).toMatch(/no token returned/i)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('routes a server USER-INVALID-USERNAME to the username field', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('USER-INVALID-USERNAME'))
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    fillVerify(result)
    await act(async () => { await result.current.submitVerify() })
    expect(result.current.fieldErrors.username).toBeTruthy()
  })

  it('routes an invalid/expired code to a form-level error', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('SIGNUP-INVALID-OR-EXPIRED-CODE'))
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    fillVerify(result)
    await act(async () => { await result.current.submitVerify() })
    expect(result.current.formError).toMatch(/invalid or has expired/i)
  })
})

describe('useSignUp — resend and back', () => {
  it('ignores resend while the cooldown is active', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { beginSignup: true } })
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitEmail() })
    await act(async () => { await result.current.resend() })
    expect(mutate).toHaveBeenCalledOnce()
  })

  it('counts the cooldown down and allows resend at zero', async () => {
    vi.useFakeTimers()
    try {
      const mutate = vi.fn().mockResolvedValue({ data: { beginSignup: true } })
      const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
      act(() => result.current.setEmail('user@example.com'))
      await act(async () => { await result.current.submitEmail() })
      act(() => { vi.advanceTimersByTime(3000) })
      expect(result.current.resendCooldown).toBe(RESEND_COOLDOWN_SECONDS - 3)
      act(() => { vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000) })
      expect(result.current.resendCooldown).toBe(0)
      await act(async () => { await result.current.resend() })
      expect(mutate).toHaveBeenCalledTimes(2)
      expect(result.current.resendCooldown).toBe(RESEND_COOLDOWN_SECONDS)
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports a resend failure as a form error', async () => {
    // Cooldown is 0 at first render, so resend goes straight to the backend (and fails here).
    const mutate = vi.fn().mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.resend() })
    expect(mutate).toHaveBeenCalledOnce()
    expect(result.current.formError).toMatch(/too many attempts/i)
  })

  it('back returns to the email step and clears errors + stale verify fields', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { beginSignup: true } })
    const { result } = renderHook(() => useSignUp(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitEmail() })
    act(() => {
      result.current.setCode('123456')
      result.current.setUsername(VALID_USERNAME)
      result.current.setPassword(VALID_PASSWORD)
    })
    act(() => result.current.back())
    expect(result.current.step).toBe('email')
    expect(result.current.formError).toBeNull()
    expect(result.current.fieldErrors).toEqual({})
    expect(result.current.code).toBe('')
    expect(result.current.username).toBe('')
    expect(result.current.password).toBe('')
    // Email is intentionally retained so the user can edit it.
    expect(result.current.email).toBe('user@example.com')
  })
})
