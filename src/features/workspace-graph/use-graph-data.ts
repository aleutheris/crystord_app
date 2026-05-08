import { useState, useEffect, useCallback } from 'react'
import { useApolloClient } from '@apollo/client/react'
import {
  RETRIEVE_QUERY,
  CREATE_ATOMS_MUTATION,
  UPDATE_ATOM_MUTATION,
  DESTROY_ATOMS_MUTATION,
} from '../../api-contract/graph-queries'
import type {
  Atom,
  RetrieveResponse,
} from '../../api-contract/graph-queries'

export interface GraphData {
  atoms: Atom[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createAtom: (title: string, labels: string[]) => Promise<string | null>
  updateAtom: (uuid: string, atom: Atom) => Promise<void>
  deleteAtom: (uuid: string) => Promise<void>
  addBond: (sourceUuid: string, targetUuid: string, bondName: string) => Promise<void>
  removeBond: (sourceUuid: string, targetUuid: string, bondName: string) => Promise<void>
}

export function useGraphData(): GraphData {
  const client = useApolloClient()
  const [atoms, setAtoms] = useState<Atom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAtoms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await client.query<RetrieveResponse>({
        query: RETRIEVE_QUERY,
        fetchPolicy: 'network-only',
      })

      setAtoms(data?.retrieve ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data')
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount
    void fetchAtoms()
  }, [fetchAtoms])

  const createAtom = useCallback(async (title: string, labels: string[]): Promise<string | null> => {
    const result = await client.mutate({
      mutation: CREATE_ATOMS_MUTATION,
      variables: {
        inputs: [{
          labels,
          properties: {
            nuclearies: { title, description: '', content: '', operation: '', constants: {} },
          },
        }],
      },
    })
    const ids = (result.data as Record<string, unknown>)?.change as string[] | undefined
    await fetchAtoms()
    return ids?.[0] ?? null
  }, [client, fetchAtoms])

  const updateAtom = useCallback(async (uuid: string, atom: Atom) => {
    await client.mutate({
      mutation: UPDATE_ATOM_MUTATION,
      variables: {
        selector: { uuid },
        inputs: [{
          labels: atom.labels,
          bonds: atom.bonds.map((b) => ({ uuid: b.uuid, name: b.name, direction: b.direction })),
          properties: { nuclearies: atom.properties.nuclearies },
        }],
      },
    })
    await fetchAtoms()
  }, [client, fetchAtoms])

  const deleteAtom = useCallback(async (uuid: string) => {
    await client.mutate({
      mutation: DESTROY_ATOMS_MUTATION,
      variables: { selector: { uuids: [uuid] } },
    })
    await fetchAtoms()
  }, [client, fetchAtoms])

  const addBond = useCallback(async (sourceUuid: string, targetUuid: string, bondName: string) => {
    const source = atoms.find((a) => a.properties.shellies.uuid === sourceUuid)
    if (!source) return

    const updated: Atom = {
      ...source,
      bonds: [...source.bonds, { uuid: targetUuid, name: bondName, direction: 'from' }],
    }
    await updateAtom(sourceUuid, updated)
  }, [atoms, updateAtom])

  const removeBond = useCallback(async (sourceUuid: string, targetUuid: string, bondName: string) => {
    const source = atoms.find((a) => a.properties.shellies.uuid === sourceUuid)
    if (!source) return

    const updated: Atom = {
      ...source,
      bonds: source.bonds.filter(
        (b) => !(b.uuid === targetUuid && b.name === bondName && b.direction === 'from'),
      ),
    }
    await updateAtom(sourceUuid, updated)
  }, [atoms, updateAtom])

  return { atoms, loading, error, refetch: fetchAtoms, createAtom, updateAtom, deleteAtom, addBond, removeBond }
}
