import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { AccountInfo } from '../../api-contract'
import { useAccountInfo } from './use-account-info'
import { ME_QUERY } from '../../api-contract'

const { mockQuery, mockClient } = vi.hoisted(() => {
  const q = vi.fn()
  return { mockQuery: q, mockClient: { query: q } }
})
vi.mock('@apollo/client/react', () => ({ useApolloClient: () => mockClient }))

const ACCOUNT: AccountInfo = { username: 'demo.user', email: 'd@e.com', emailVerified: true, authMethods: ['password'] }

beforeEach(() => { mockQuery.mockReset() })

describe('useAccountInfo', () => {
  it('loads the account from the me query', async () => {
    mockQuery.mockResolvedValue({ data: { me: ACCOUNT } })
    const { result } = renderHook(() => useAccountInfo())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockQuery).toHaveBeenCalledWith({ query: ME_QUERY, fetchPolicy: 'network-only' })
    expect(result.current.account).toEqual(ACCOUNT)
    expect(result.current.error).toBeNull()
  })

  it('surfaces a generic error when me returns no data', async () => {
    mockQuery.mockResolvedValue({ data: {} })
    const { result } = renderHook(() => useAccountInfo())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.account).toBeNull()
    expect(result.current.error).toMatch(/could not load/i)
  })

  it('surfaces a generic error when the query rejects', async () => {
    mockQuery.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useAccountInfo())

    await waitFor(() => expect(result.current.error).toMatch(/could not load/i))
  })

  it('refetches me on demand', async () => {
    mockQuery.mockResolvedValue({ data: { me: ACCOUNT } })
    const { result } = renderHook(() => useAccountInfo())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockQuery).toHaveBeenCalledTimes(1)

    await act(async () => { result.current.refetch() })
    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(2))
  })

  it('ignores a resolved response after unmount', async () => {
    let resolve!: (v: { data: { me: AccountInfo } }) => void
    mockQuery.mockReturnValue(new Promise((r) => { resolve = r }))
    const { unmount } = renderHook(() => useAccountInfo())
    unmount()
    resolve({ data: { me: ACCOUNT } })
    await Promise.resolve()
    await Promise.resolve()
  })

  it('ignores a rejected response after unmount', async () => {
    let reject!: (e: Error) => void
    mockQuery.mockReturnValue(new Promise((_r, rj) => { reject = rj }))
    const { unmount } = renderHook(() => useAccountInfo())
    unmount()
    reject(new Error('late'))
    await Promise.resolve()
    await Promise.resolve()
  })
})
