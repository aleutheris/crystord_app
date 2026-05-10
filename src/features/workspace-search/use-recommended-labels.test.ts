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
  it('uses list_labels query with empty prefix on mount', async () => {
    mockQuery.mockResolvedValue({ data: { list_labels: ['Project', 'Task', 'Active'] } })

    renderHook(() => useRecommendedLabels())

    await waitFor(() => expect(mockQuery).toHaveBeenCalledWith({
      query: LIST_LABELS_QUERY,
      variables: { prefix: '' },
      fetchPolicy: 'cache-first',
    }))
  })

  it('caps returned labels to exactly three when more are available', async () => {
    const many = ['A', 'B', 'C', 'D', 'E', 'F']
    mockQuery.mockResolvedValue({ data: { list_labels: many } })

    const { result } = renderHook(() => useRecommendedLabels())

    await waitFor(() => expect(result.current).toHaveLength(3))
    for (const label of result.current) {
      expect(many).toContain(label)
    }
  })

  it('returns all labels when fewer than three are available', async () => {
    mockQuery.mockResolvedValue({ data: { list_labels: ['Only', 'Two'] } })

    const { result } = renderHook(() => useRecommendedLabels())

    await waitFor(() => expect(result.current).toHaveLength(2))
    expect(result.current).toEqual(expect.arrayContaining(['Only', 'Two']))
  })

  it('returns empty array when list_labels is absent in response', async () => {
    mockQuery.mockResolvedValue({ data: {} })

    const { result } = renderHook(() => useRecommendedLabels())

    await waitFor(() => expect(mockQuery).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })

  it('returns empty array when fetch fails', async () => {
    mockQuery.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useRecommendedLabels())

    await waitFor(() => expect(mockQuery).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })
})
