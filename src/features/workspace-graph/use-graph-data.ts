import { useState, useCallback, useRef } from 'react'
import { useApolloClient } from '@apollo/client/react'
import {
  RETRIEVE_QUERY,
  CREATE_ATOMS_MUTATION,
  UPDATE_ATOM_MUTATION,
  DESTROY_ATOMS_MUTATION,
} from '../../api-contract/graph-queries'
import type {
  Atom,
  DestroyResponse,
  RetrieveResponse,
} from '../../api-contract/graph-queries'

export interface GraphData {
  atoms: Atom[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  search: (labels: string[]) => Promise<void>
  createAtom: (title: string, labels: string[]) => Promise<string | null>
  updateAtom: (uuid: string, atom: Atom) => Promise<void>
  deleteAtom: (uuid: string) => Promise<void>
  addBond: (sourceUuid: string, targetUuid: string, bondName: string) => Promise<void>
  removeBond: (sourceUuid: string, targetUuid: string, bondName: string) => Promise<void>
}

export function useGraphData(): GraphData {
  const client = useApolloClient()
  const [atoms, setAtoms] = useState<Atom[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchLabelsRef = useRef<string[]>([])

  const fetchAtoms = useCallback(async (labels?: string[]) => {
    if (labels !== undefined) {
      searchLabelsRef.current = labels
    }
    const activeLabels = searchLabelsRef.current
    setLoading(true)
    setError(null)
    try {
      const { data } = await client.query<RetrieveResponse>({
        query: RETRIEVE_QUERY,
        variables: activeLabels.length > 0 ? { labels: activeLabels } : undefined,
        fetchPolicy: 'network-only',
      })

      setAtoms(data?.retrieve ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data')
    } finally {
      setLoading(false)
    }
  }, [client])

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

  const toNucleariesInput = useCallback((nuclearies: Atom['properties']['nuclearies']) => ({
    title: nuclearies.title,
    description: nuclearies.description,
    content: nuclearies.content,
    operation: nuclearies.operation,
    constants: nuclearies.constants,
  }), [])

  const stripSystemBonds = useCallback((bonds: Atom['bonds']) =>
    bonds.filter((bond) => bond.name !== 'OP_DEPENDENCY'),
  [])

  const updateAtom = useCallback(async (uuid: string, atom: Atom) => {
    await client.mutate({
      mutation: UPDATE_ATOM_MUTATION,
      variables: {
        selector: { uuid },
        inputs: [{
          labels: atom.labels,
          bonds: stripSystemBonds(atom.bonds).map((b) => ({ uuid: b.uuid, name: b.name, direction: b.direction })),
          properties: { nuclearies: toNucleariesInput(atom.properties.nuclearies) },
        }],
      },
    })
    await fetchAtoms()
  }, [client, fetchAtoms, stripSystemBonds, toNucleariesInput])

  const deleteAtom = useCallback(async (uuid: string) => {
    const result = await client.mutate<DestroyResponse>({
      mutation: DESTROY_ATOMS_MUTATION,
      variables: { selector: { uuids: [uuid] } },
    })
    const deleted = result.data?.destroy?.deleted ?? []
    if (deleted.length === 0) {
      await fetchAtoms()
      return
    }
    await fetchAtoms()
  }, [client, fetchAtoms])

  const addBond = useCallback(async (sourceUuid: string, targetUuid: string, bondName: string) => {
    const source = atoms.find((a) => a.properties.shellies.uuid === sourceUuid)
    if (!source) return

    const updated: Atom = {
      ...source,
      bonds: [...stripSystemBonds(source.bonds), { uuid: targetUuid, name: bondName, direction: 'from' }],
    }
    await updateAtom(sourceUuid, updated)
  }, [atoms, updateAtom, stripSystemBonds])

  const removeBond = useCallback(async (sourceUuid: string, targetUuid: string, bondName: string) => {
    const source = atoms.find((a) => a.properties.shellies.uuid === sourceUuid)
    if (!source) return

    const updated: Atom = {
      ...source,
      bonds: stripSystemBonds(source.bonds).filter(
        (b) => !(b.uuid === targetUuid && b.name === bondName && b.direction === 'from'),
      ),
    }
    await updateAtom(sourceUuid, updated)
  }, [atoms, updateAtom, stripSystemBonds])

  return { atoms, loading, error, refetch: fetchAtoms, search: fetchAtoms, createAtom, updateAtom, deleteAtom, addBond, removeBond }
}
