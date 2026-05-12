import { useCallback, useMemo, useState } from 'react'
import type { Edge, Connection, NodeMouseHandler } from '@xyflow/react'
import type { Atom } from '../../api-contract/graph-queries'
import type { GraphData } from './use-graph-data'
import type { UndoEntry } from './UndoNotification'

interface UseCanvasInteractionsProps {
  atoms: Atom[]
  edges: Edge[]
  selectedAtomId: string | null
  onSelectAtom: (id: string | null) => void
  deleteAtom: GraphData['deleteAtom']
  createAtom: GraphData['createAtom']
  addBond: GraphData['addBond']
  removeBond: GraphData['removeBond']
}

export function useCanvasInteractions({
  atoms,
  edges,
  selectedAtomId,
  onSelectAtom,
  deleteAtom,
  createAtom,
  addBond,
  removeBond,
}: UseCanvasInteractionsProps) {
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Atom | null>(null)
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null)

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    onSelectAtom(node.id)
  }, [onSelectAtom])

  const onPaneClick = useCallback(() => {
    onSelectAtom(null)
  }, [onSelectAtom])

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      setPendingConnection({ source: connection.source, target: connection.target })
    }
  }, [])

  const handleBondConfirm = useCallback(async (bondName: string) => {
    if (!pendingConnection) return
    try {
      await addBond(pendingConnection.source, pendingConnection.target, bondName)
    } catch { /* refetch will correct state */ }
    setPendingConnection(null)
  }, [pendingConnection, addBond])

  const handleDeleteRequest = useCallback((atomId: string) => {
    const atom = atoms.find((a) => a.properties.shellies.uuid === atomId)
    if (atom) setConfirmDelete(atom)
  }, [atoms])

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDelete) return
    const deletedAtom = confirmDelete
    setConfirmDelete(null)
    try {
      await deleteAtom(deletedAtom.properties.shellies.uuid)
      setUndoEntry({ type: 'atom', atom: deletedAtom })
      if (selectedAtomId === deletedAtom.properties.shellies.uuid) {
        onSelectAtom(null)
      }
    } catch { /* error is visible via refetch */ }
  }, [confirmDelete, deleteAtom, selectedAtomId, onSelectAtom])

  const handleEdgeDelete = useCallback(async (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId)
    if (!edge) return
    const sourceAtom = atoms.find((a) => a.properties.shellies.uuid === edge.source)
    if (!sourceAtom) return
    const bond = sourceAtom.bonds.find(
      (b) => b.uuid === edge.target && b.name === String(edge.label) && b.direction === 'from',
    )
    if (!bond) return
    try {
      await removeBond(edge.source, edge.target, bond.name)
      setUndoEntry({ type: 'bond', atom: sourceAtom, bond })
    } catch { /* error visible via refetch */ }
  }, [atoms, edges, removeBond])

  const handleUndo = useCallback(async (entry: UndoEntry) => {
    setUndoEntry(null)
    try {
      if (entry.type === 'atom') {
        await createAtom(entry.atom.properties.nuclearies.title, entry.atom.labels)
      } else if (entry.bond) {
        await addBond(entry.atom.properties.shellies.uuid, entry.bond.uuid, entry.bond.name)
      }
    } catch { /* best-effort undo */ }
  }, [createAtom, addBond])

  const handleDoubleClick = useCallback(async () => {
    try {
      const id = await createAtom('New Atom', ['Node'])
      if (id) onSelectAtom(id)
    } catch { /* error visible via refetch */ }
  }, [createAtom, onSelectAtom])

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedAtomId) {
      event.preventDefault()
      const selectedEdge = edges.find((e) => e.selected)
      if (selectedEdge) {
        void handleEdgeDelete(selectedEdge.id)
      } else {
        handleDeleteRequest(selectedAtomId)
      }
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onSelectAtom(null)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      if (atoms.length === 0) return
      const idx = selectedAtomId ? atoms.findIndex((a) => a.properties.shellies.uuid === selectedAtomId) : -1
      onSelectAtom(atoms[(idx + 1) % atoms.length]!.properties.shellies.uuid)
      return
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      if (atoms.length === 0) return
      const idx = selectedAtomId ? atoms.findIndex((a) => a.properties.shellies.uuid === selectedAtomId) : 0
      onSelectAtom(atoms[(idx - 1 + atoms.length) % atoms.length]!.properties.shellies.uuid)
    }
  }, [selectedAtomId, atoms, edges, onSelectAtom, handleDeleteRequest, handleEdgeDelete])

  const pendingSource = useMemo(() =>
    pendingConnection ? atoms.find((a) => a.properties.shellies.uuid === pendingConnection.source) : null,
    [pendingConnection, atoms],
  )

  const pendingTarget = useMemo(() =>
    pendingConnection ? atoms.find((a) => a.properties.shellies.uuid === pendingConnection.target) : null,
    [pendingConnection, atoms],
  )

  return {
    pendingConnection,
    confirmDelete,
    undoEntry,
    pendingSource,
    pendingTarget,
    onNodeClick,
    onPaneClick,
    onConnect,
    onKeyDown,
    handleBondConfirm,
    handleDeleteConfirm,
    handleUndo,
    handleDoubleClick,
    setPendingConnection,
    setConfirmDelete,
    setUndoEntry,
  }
}
