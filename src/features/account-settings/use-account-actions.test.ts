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

function setup(onChanged = vi.fn(), onSessionEnded = vi.fn()) {
  const { result } = renderHook(() => useAccountActions(onChanged, onSessionEnded))
  return { result, onChanged, onSessionEnded }
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

describe('useAccountActions — requestEmailChange', () => {
  it('sends a code and resolves true on success', async () => {
    mockMutate.mockResolvedValue({ data: { requestEmailChange: true } })
    const { result } = setup()
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.requestEmailChange('new@e.com') })
    expect(ok).toBe(true)
    expect(result.current.feedback).toEqual({ kind: 'success', message: 'We sent a code to new@e.com. Enter it below to confirm.' })
  })

  it('routes EMAIL-ALREADY-IN-USE to the email field and resolves false', async () => {
    mockMutate.mockRejectedValue(new Error('EMAIL-ALREADY-IN-USE'))
    const { result } = setup()
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.requestEmailChange('taken@e.com') })
    expect(ok).toBe(false)
    expect(result.current.emailError).toMatch(/already in use/i)
  })

  it('shows the mapped message for a known non-field error', async () => {
    mockMutate.mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { result } = setup()
    await act(async () => { await result.current.requestEmailChange('new@e.com') })
    expect(result.current.feedback?.message).toMatch(/too many attempts/i)
  })

  it('shows a generic error when the request returns falsy', async () => {
    mockMutate.mockResolvedValue({ data: { requestEmailChange: false } })
    const { result } = setup()
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.requestEmailChange('new@e.com') })
    expect(ok).toBe(false)
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not start the email change.' })
  })

  it('shows a generic error for an unknown failure', async () => {
    mockMutate.mockRejectedValue(new Error('boom'))
    const { result } = setup()
    await act(async () => { await result.current.requestEmailChange('new@e.com') })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not start the email change.' })
  })

  it('clears a stale code error from a prior failed confirmation', async () => {
    const { result } = setup()
    mockMutate.mockRejectedValueOnce(new Error('EMAIL-CHANGE-INVALID-OR-EXPIRED-CODE'))
    await act(async () => { await result.current.confirmEmailChange('000000') })
    expect(result.current.codeError).not.toBeNull()
    // requesting a new email must not carry the stale code error into the next confirm step
    mockMutate.mockResolvedValueOnce({ data: { requestEmailChange: true } })
    await act(async () => { await result.current.requestEmailChange('new@e.com') })
    expect(result.current.codeError).toBeNull()
  })
})

describe('useAccountActions — confirmEmailChange', () => {
  it('confirms, refreshes, and resolves true on success', async () => {
    const onChanged = vi.fn()
    mockMutate.mockResolvedValue({ data: { confirmEmailChange: true } })
    const { result } = setup(onChanged)
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.confirmEmailChange('123456') })
    expect(ok).toBe(true)
    expect(result.current.feedback).toEqual({ kind: 'success', message: 'Email updated.' })
    expect(onChanged).toHaveBeenCalledOnce()
  })

  it('routes an invalid/expired code to the code field and resolves false', async () => {
    mockMutate.mockRejectedValue(new Error('EMAIL-CHANGE-INVALID-OR-EXPIRED-CODE'))
    const { result } = setup()
    let ok: boolean | undefined
    await act(async () => { ok = await result.current.confirmEmailChange('000000') })
    expect(ok).toBe(false)
    expect(result.current.codeError).toMatch(/invalid or has expired/i)
  })

  it('shows the mapped message for a known non-field error', async () => {
    mockMutate.mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { result } = setup()
    await act(async () => { await result.current.confirmEmailChange('123456') })
    expect(result.current.feedback?.message).toMatch(/too many attempts/i)
  })

  it('shows a generic error when confirm returns falsy', async () => {
    mockMutate.mockResolvedValue({ data: { confirmEmailChange: false } })
    const { result } = setup()
    await act(async () => { await result.current.confirmEmailChange('123456') })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not confirm the email change.' })
  })

  it('shows a generic error for an unknown failure', async () => {
    mockMutate.mockRejectedValue('boom-string')
    const { result } = setup()
    await act(async () => { await result.current.confirmEmailChange('123456') })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not confirm the email change.' })
  })
})

describe('useAccountActions — signOutEverywhere', () => {
  it('ends the session on success', async () => {
    const onSessionEnded = vi.fn()
    mockMutate.mockResolvedValue({ data: { revokeAllSessions: true } })
    const { result } = setup(vi.fn(), onSessionEnded)
    await act(async () => { await result.current.signOutEverywhere() })
    expect(onSessionEnded).toHaveBeenCalledOnce()
  })

  it('shows the mapped message for a known error without ending the session', async () => {
    const onSessionEnded = vi.fn()
    mockMutate.mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { result } = setup(vi.fn(), onSessionEnded)
    await act(async () => { await result.current.signOutEverywhere() })
    expect(result.current.feedback?.message).toMatch(/too many attempts/i)
    expect(onSessionEnded).not.toHaveBeenCalled()
  })

  it('shows a generic error when revoke returns falsy', async () => {
    mockMutate.mockResolvedValue({ data: { revokeAllSessions: false } })
    const { result } = setup()
    await act(async () => { await result.current.signOutEverywhere() })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not sign out everywhere.' })
  })

  it('shows a generic error for an unknown failure', async () => {
    mockMutate.mockRejectedValue(new Error('boom'))
    const { result } = setup()
    await act(async () => { await result.current.signOutEverywhere() })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not sign out everywhere.' })
  })
})

describe('useAccountActions — deleteAccount', () => {
  it('ends the session on success', async () => {
    const onSessionEnded = vi.fn()
    mockMutate.mockResolvedValue({ data: { deleteMyAccount: true } })
    const { result } = setup(vi.fn(), onSessionEnded)
    await act(async () => { await result.current.deleteAccount() })
    expect(onSessionEnded).toHaveBeenCalledOnce()
  })

  it('surfaces the owned-atoms block reason without ending the session', async () => {
    const onSessionEnded = vi.fn()
    mockMutate.mockRejectedValue(new Error('CR-15-OWNED-ATOMS-EXIST'))
    const { result } = setup(vi.fn(), onSessionEnded)
    await act(async () => { await result.current.deleteAccount() })
    expect(result.current.feedback?.message).toMatch(/still own atoms/i)
    expect(onSessionEnded).not.toHaveBeenCalled()
  })

  it('surfaces the sole-admin block reason', async () => {
    mockMutate.mockRejectedValue(new Error('CR-15-WORKSPACE-ADMIN-EXISTS'))
    const { result } = setup()
    await act(async () => { await result.current.deleteAccount() })
    expect(result.current.feedback?.message).toMatch(/sole admin/i)
  })

  it('shows a generic error when delete returns falsy', async () => {
    mockMutate.mockResolvedValue({ data: { deleteMyAccount: false } })
    const { result } = setup()
    await act(async () => { await result.current.deleteAccount() })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not delete your account.' })
  })

  it('shows a generic error for an unknown failure', async () => {
    mockMutate.mockRejectedValue(new Error('boom'))
    const { result } = setup()
    await act(async () => { await result.current.deleteAccount() })
    expect(result.current.feedback).toEqual({ kind: 'error', message: 'Could not delete your account.' })
  })
})

describe('useAccountActions — clearFeedback', () => {
  it('clears the password and email inline errors', async () => {
    const { result } = setup()
    // password + email inline errors coexist — neither action clears the other
    await act(async () => { await result.current.setPassword('short') })
    mockMutate.mockRejectedValueOnce(new Error('EMAIL-ALREADY-IN-USE'))
    await act(async () => { await result.current.requestEmailChange('taken@e.com') })
    expect(result.current.passwordError).not.toBeNull()
    expect(result.current.emailError).not.toBeNull()
    act(() => result.current.clearFeedback())
    expect(result.current.passwordError).toBeNull()
    expect(result.current.emailError).toBeNull()
  })

  it('clears the shared feedback and the code inline error', async () => {
    const { result } = setup()
    // a code error from a failed confirm, then a feedback message from another action
    mockMutate.mockRejectedValueOnce(new Error('EMAIL-CHANGE-INVALID-OR-EXPIRED-CODE'))
    await act(async () => { await result.current.confirmEmailChange('000000') })
    mockMutate.mockRejectedValueOnce(new Error('AUTH-RATE-LIMITED'))
    await act(async () => { await result.current.signOutEverywhere() })
    expect(result.current.feedback).not.toBeNull()
    expect(result.current.codeError).not.toBeNull()
    act(() => result.current.clearFeedback())
    expect(result.current.feedback).toBeNull()
    expect(result.current.codeError).toBeNull()
  })
})
