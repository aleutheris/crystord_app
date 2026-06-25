import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ApolloClient } from '@apollo/client'
import { usePasswordReset, confirmFieldErrors } from './use-password-reset'

const VALID_PASSWORD = 'correct horse battery'

function makeClient(mutate: ReturnType<typeof vi.fn>): ApolloClient {
  return { mutate } as unknown as ApolloClient
}

function fillConfirm(result: { current: ReturnType<typeof usePasswordReset> }) {
  act(() => {
    result.current.setToken('123456')
    result.current.setNewPassword(VALID_PASSWORD)
  })
}

describe('confirmFieldErrors', () => {
  it('flags an empty token and a weak password', () => {
    const errors = confirmFieldErrors('', 'short')
    expect(errors.token).toBeTruthy()
    expect(errors.newPassword).toBeTruthy()
  })
  it('returns no errors when valid', () => {
    expect(confirmFieldErrors('123456', VALID_PASSWORD)).toEqual({})
  })
})

describe('usePasswordReset — request step', () => {
  it('starts on the request step', () => {
    const { result } = renderHook(() => usePasswordReset(makeClient(vi.fn()), vi.fn()))
    expect(result.current.step).toBe('request')
  })

  it('blocks an empty email without calling the backend', async () => {
    const mutate = vi.fn()
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), vi.fn()))
    await act(async () => { await result.current.submitRequest() })
    expect(result.current.fieldErrors.email).toBeTruthy()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('requests a reset and advances to the confirm step', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { requestPasswordReset: true } })
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitRequest() })
    expect(mutate).toHaveBeenCalledOnce()
    expect(result.current.step).toBe('confirm')
  })

  it('surfaces a rate-limit as a form error and stays on the request step', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitRequest() })
    expect(result.current.formError).toMatch(/too many attempts/i)
    expect(result.current.step).toBe('request')
  })

  it('handles a non-Error rejection via the unknown fallback', async () => {
    const mutate = vi.fn().mockRejectedValue('boom')
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitRequest() })
    expect(result.current.formError).toBeTruthy()
  })
})

describe('usePasswordReset — confirm step', () => {
  it('blocks invalid client-side fields without calling confirm', async () => {
    const mutate = vi.fn()
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), vi.fn()))
    await act(async () => { await result.current.submitConfirm() })
    expect(result.current.fieldErrors.token).toBeTruthy()
    expect(result.current.fieldErrors.newPassword).toBeTruthy()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('completes the reset and calls onComplete on success', async () => {
    const onComplete = vi.fn()
    const mutate = vi.fn().mockResolvedValue({ data: { confirmPasswordReset: true } })
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), onComplete))
    fillConfirm(result)
    await act(async () => { await result.current.submitConfirm() })
    expect(mutate.mock.calls[0]![0].variables).toEqual({ token: '123456', newPassword: VALID_PASSWORD })
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('shows a form error when the reset returns falsy', async () => {
    const onComplete = vi.fn()
    const mutate = vi.fn().mockResolvedValue({ data: { confirmPasswordReset: false } })
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), onComplete))
    fillConfirm(result)
    await act(async () => { await result.current.submitConfirm() })
    expect(result.current.formError).toMatch(/reset failed/i)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('routes an invalid/expired token to a form error', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('RESET-INVALID-OR-EXPIRED-TOKEN'))
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), vi.fn()))
    fillConfirm(result)
    await act(async () => { await result.current.submitConfirm() })
    expect(result.current.formError).toMatch(/invalid or has expired/i)
  })

  it('routes a server PASSWORD-TOO-COMMON to the new-password field', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('PASSWORD-TOO-COMMON'))
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), vi.fn()))
    fillConfirm(result)
    await act(async () => { await result.current.submitConfirm() })
    expect(result.current.fieldErrors.newPassword).toMatch(/too common/i)
  })
})

describe('usePasswordReset — back', () => {
  it('returns to the request step and clears the confirm fields', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { requestPasswordReset: true } })
    const { result } = renderHook(() => usePasswordReset(makeClient(mutate), vi.fn()))
    act(() => result.current.setEmail('user@example.com'))
    await act(async () => { await result.current.submitRequest() })
    fillConfirm(result)
    act(() => result.current.back())
    expect(result.current.step).toBe('request')
    expect(result.current.token).toBe('')
    expect(result.current.newPassword).toBe('')
    expect(result.current.email).toBe('user@example.com')
  })
})
