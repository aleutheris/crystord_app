import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLogout } from './use-logout'
import { LOGOUT_MUTATION } from '../../api-contract/auth-operations'

const { mockMutate, mockSignOut } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockSignOut: vi.fn(),
}))

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({ mutate: mockMutate }),
}))
vi.mock('./AuthProvider', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}))

beforeEach(() => {
  mockMutate.mockReset()
  mockSignOut.mockReset()
})

describe('useLogout', () => {
  it('fires the logout mutation and clears local auth state', () => {
    mockMutate.mockResolvedValue({ data: { logout: true } })
    const { result } = renderHook(() => useLogout())

    result.current()

    expect(mockMutate).toHaveBeenCalledWith({ mutation: LOGOUT_MUTATION })
    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('clears local state even when the logout mutation rejects (best-effort revocation)', async () => {
    mockMutate.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useLogout())

    result.current()

    // signOut runs synchronously regardless of the fire-and-forget mutation outcome.
    expect(mockSignOut).toHaveBeenCalledOnce()
    await Promise.resolve() // let the caught rejection settle
  })
})
