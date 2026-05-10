import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGraphData } from './use-graph-data'
import { RETRIEVE_QUERY } from '../../api-contract/graph-queries'

const mockQuery = vi.fn()
const mockMutate = vi.fn()

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({ query: mockQuery, mutate: mockMutate }),
}))

beforeEach(() => {
  mockQuery.mockReset()
  mockMutate.mockReset()
})

const emptyRetrieve = { data: { retrieve: [] } }

describe('useGraphData search', () => {
  it('search sends committed labels as query variables', async () => {
    mockQuery.mockResolvedValue(emptyRetrieve)
    const { result } = renderHook(() => useGraphData())

    await act(() => result.current.search(['Project', 'Task']))

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
      query: RETRIEVE_QUERY,
      variables: { labels: ['Project', 'Task'] },
    }))
  })

  it('search with empty labels fetches without label variables', async () => {
    mockQuery.mockResolvedValue(emptyRetrieve)
    const { result } = renderHook(() => useGraphData())

    await act(() => result.current.search([]))

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
      query: RETRIEVE_QUERY,
      variables: undefined,
    }))
  })

  it('refetch after search re-uses the last committed labels', async () => {
    mockQuery.mockResolvedValue(emptyRetrieve)
    const { result } = renderHook(() => useGraphData())

    await act(() => result.current.search(['Project']))
    mockQuery.mockClear()

    await act(() => result.current.refetch())

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
      variables: { labels: ['Project'] },
    }))
  })

  it('atoms are populated from backend response', async () => {
    const atom = {
      labels: ['Project'],
      bonds: [],
      properties: {
        shellies: { uuid: 'u1' },
        nuclearies: { title: 'Alpha', description: '', content: '', operation: null, constants: null },
      },
    }
    mockQuery.mockResolvedValue({ data: { retrieve: [atom] } })
    const { result } = renderHook(() => useGraphData())

    await act(() => result.current.search(['Project']))

    expect(result.current.atoms).toHaveLength(1)
    expect(result.current.atoms[0]!.properties.shellies.uuid).toBe('u1')
  })
})
