import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRecommendedLabels } from './use-recommended-labels'
import { LIST_LABELS_QUERY } from '../../api-contract/graph-queries'

const mockQuery = vi.fn()

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({ query: mockQuery }),
}))

beforeEach(() => {
  mockQuery.mockReset()
})

describe('useRecommendedLabels', () => {
  it('returns labels fetched from list_labels on mount', async () => {
    mockQuery.mockResolvedValue({ data: { list_labels: ['Project', 'Task', 'Active'] } })

    const { result } = renderHook(() => useRecommendedLabels())

    await waitFor(() => expect(result.current).toEqual(['Project', 'Task', 'Active']))

    expect(mockQuery).toHaveBeenCalledWith({
      query: LIST_LABELS_QUERY,
      variables: { prefix: '' },
      fetchPolicy: 'cache-first',
    })
  })

  it('returns empty array when fetch fails', async () => {
    mockQuery.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useRecommendedLabels())

    await waitFor(() => expect(mockQuery).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })

  it('returns empty array when list_labels is absent in response', async () => {
    mockQuery.mockResolvedValue({ data: {} })

    const { result } = renderHook(() => useRecommendedLabels())

    await waitFor(() => expect(mockQuery).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })
})
