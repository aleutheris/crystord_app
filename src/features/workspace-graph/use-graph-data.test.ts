import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGraphData } from './use-graph-data'
import { RETRIEVE_QUERY, UPDATE_ATOM_MUTATION } from '../../api-contract/graph-queries'

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

  it('repeated identical search triggers two separate backend queries', async () => {
    mockQuery.mockResolvedValue(emptyRetrieve)
    const { result } = renderHook(() => useGraphData())

    await act(() => result.current.search(['Project']))
    await act(() => result.current.search(['Project']))

    expect(mockQuery).toHaveBeenCalledTimes(2)
  })

  it('search uses network-only fetch policy to bypass Apollo cache', async () => {
    mockQuery.mockResolvedValue(emptyRetrieve)
    const { result } = renderHook(() => useGraphData())

    await act(() => result.current.search(['Task']))

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
      fetchPolicy: 'network-only',
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

describe('useGraphData bond mutations', () => {
  it('addBond strips __typename from nuclearies mutation input', async () => {
    const atom = {
      labels: ['Project'],
      bonds: [],
      properties: {
        shellies: { uuid: 'u1' },
        nuclearies: {
          __typename: 'NucleariesOutput',
          title: 'var1',
          description: '',
          content: '1',
          operation: '',
          constants: {},
        },
      },
    }
    mockQuery.mockResolvedValue({ data: { retrieve: [atom] } })
    mockMutate.mockResolvedValue({ data: { change: ['u1'] } })
    const { result } = renderHook(() => useGraphData())

    await act(() => result.current.search(['Project']))
    await act(() => result.current.addBond('u1', 'u2', 'depends_on'))

    const updateCall = mockMutate.mock.calls.find(
      ([args]) => args.mutation === UPDATE_ATOM_MUTATION,
    )
    expect(updateCall).toBeDefined()
    expect(updateCall?.[0].variables.inputs[0].properties.nuclearies).toEqual({
      title: 'var1',
      description: '',
      content: '1',
      operation: '',
      constants: {},
    })
  })

  it('removeBond strips __typename from nuclearies mutation input', async () => {
    const atom = {
      labels: ['Project'],
      bonds: [{ uuid: 'u2', name: 'depends_on', direction: 'from', __typename: 'BondOutput' }],
      properties: {
        shellies: { uuid: 'u1' },
        nuclearies: {
          __typename: 'NucleariesOutput',
          title: 'var1',
          description: '',
          content: '1',
          operation: '',
          constants: {},
        },
      },
    }
    mockQuery.mockResolvedValue({ data: { retrieve: [atom] } })
    mockMutate.mockResolvedValue({ data: { change: ['u1'] } })
    const { result } = renderHook(() => useGraphData())

    await act(() => result.current.search(['Project']))
    await act(() => result.current.removeBond('u1', 'u2', 'depends_on'))

    const updateCall = mockMutate.mock.calls.find(
      ([args]) => args.mutation === UPDATE_ATOM_MUTATION,
    )
    expect(updateCall).toBeDefined()
    expect(updateCall?.[0].variables.inputs[0].properties.nuclearies).toEqual({
      title: 'var1',
      description: '',
      content: '1',
      operation: '',
      constants: {},
    })
  })
})
