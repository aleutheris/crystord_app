import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAccountActions } from './use-account-actions'

const { mockMutate, mockClient } = vi.hoisted(() => {
  const m = vi.fn()
  return { mockMutate: m, mockClient: { mutate: m } }
})
vi.mock('@apollo/client/react', () => ({ useApolloClient: () => mockClient }))

const VALID_PASSWORD = 'correct horse battery'

beforeEach(() => { mockMutate.mockReset() })

function setup(onChanged = vi.fn()) {
  const { result } = renderHook(() => useAccountActions(onChanged))
  return { result, onChanged }
}

describe('useAccountActions — setPassword', () => {
  it('rejects a weak password client-side without calling the backend', async () => {
    const { result } = setup()
    await act(async () => { await result.current.setPassword('short') })
    expect(result.current.passwordError).toMatch(/at least 12/i)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('sets the password and refreshes on success', async () => {
    const onChanged = vi.fn()
    mockMutate.mockResolvedValue({ data: { setPassword: true } })
    const { result } = setup(onChanged)
    await act(async () => { await result.current.setPassword(VALID_PASSWORD) })
    expect(result.current.feedback).toEqual({ kind: 'success', message: 'Password updated.' })
    expect(onChanged).toHaveBeenCalledOnce()
  })

  it('shows an error when setPassword returns falsy', async () => {
    mockMutate.mockResolvedValue({ data: { setPassword: false } })
    const { result } = setup()
    await act(async () => { await result.current.setPassword(VALID_PASSWORD) })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not update your password.' })
  })

  it('routes a server PASSWORD-TOO-COMMON to the password field', async () => {
    mockMutate.mockRejectedValue(new Error('PASSWORD-TOO-COMMON'))
    const { result } = setup()
    await act(async () => { await result.current.setPassword(VALID_PASSWORD) })
    expect(result.current.passwordError).toMatch(/too common/i)
  })

  it('shows the mapped message for a known non-field error (rate-limit)', async () => {
    mockMutate.mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { result } = setup()
    await act(async () => { await result.current.setPassword(VALID_PASSWORD) })
    expect(result.current.feedback?.message).toMatch(/too many attempts/i)
  })

  it('shows a generic error for an unknown setPassword failure', async () => {
    mockMutate.mockRejectedValue(new Error('boom'))
    const { result } = setup()
    await act(async () => { await result.current.setPassword(VALID_PASSWORD) })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not update your password.' })
  })
})

describe('useAccountActions — unlinkMethod', () => {
  it('removes a method and refreshes on success', async () => {
    const onChanged = vi.fn()
    mockMutate.mockResolvedValue({ data: { unlinkAuthMethod: true } })
    const { result } = setup(onChanged)
    await act(async () => { await result.current.unlinkMethod('google') })
    expect(result.current.feedback).toEqual({ kind: 'success', message: 'Removed google sign-in.' })
    expect(onChanged).toHaveBeenCalledOnce()
  })

  it('shows the mapped error when removing the last method', async () => {
    mockMutate.mockRejectedValue(new Error('AUTH-CANNOT-REMOVE-LAST-METHOD'))
    const { result } = setup()
    await act(async () => { await result.current.unlinkMethod('password') })
    expect(result.current.feedback?.message).toMatch(/only sign-in method/i)
  })

  it('shows a generic error when unlink returns falsy', async () => {
    mockMutate.mockResolvedValue({ data: { unlinkAuthMethod: false } })
    const { result } = setup()
    await act(async () => { await result.current.unlinkMethod('google') })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not remove that method.' })
  })

  it('shows a generic error for an unknown unlink failure', async () => {
    mockMutate.mockRejectedValue(new Error('boom'))
    const { result } = setup()
    await act(async () => { await result.current.unlinkMethod('google') })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not remove that method.' })
  })
})

describe('useAccountActions — linkGoogle', () => {
  it('links Google and refreshes on success', async () => {
    const onChanged = vi.fn()
    mockMutate.mockResolvedValue({ data: { linkGoogle: true } })
    const { result } = setup(onChanged)
    await act(async () => { await result.current.linkGoogle('id-token') })
    expect(result.current.feedback).toEqual({ kind: 'success', message: 'Google linked.' })
    expect(onChanged).toHaveBeenCalledOnce()
  })

  it('shows the mapped error on email mismatch', async () => {
    mockMutate.mockRejectedValue(new Error('AUTH-GOOGLE-EMAIL-MISMATCH'))
    const { result } = setup()
    await act(async () => { await result.current.linkGoogle('id-token') })
    expect(result.current.feedback?.message).toMatch(/doesn't match/i)
  })

  it('shows a generic error when linkGoogle returns falsy', async () => {
    mockMutate.mockResolvedValue({ data: { linkGoogle: false } })
    const { result } = setup()
    await act(async () => { await result.current.linkGoogle('id-token') })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not link Google.' })
  })

  it('shows a generic error for an unknown link failure', async () => {
    mockMutate.mockRejectedValue('boom-string')
    const { result } = setup()
    await act(async () => { await result.current.linkGoogle('id-token') })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not link Google.' })
  })
})

describe('useAccountActions — clearFeedback', () => {
  it('clears feedback and the password error', async () => {
    mockMutate.mockResolvedValue({ data: { setPassword: true } })
    const { result } = setup()
    await act(async () => { await result.current.setPassword(VALID_PASSWORD) })
    expect(result.current.feedback).not.toBeNull()
    act(() => result.current.clearFeedback())
    expect(result.current.feedback).toBeNull()
    expect(result.current.passwordError).toBeNull()
  })
})
