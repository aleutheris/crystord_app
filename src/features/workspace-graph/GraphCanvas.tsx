import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import type { Node, Edge, Connection, NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Atom } from '../../api-contract/graph-queries'
import type { GraphData } from './use-graph-data'
import { atomsToNodes, atomsToEdges, mergeNodePositions } from './graph-types'
import { AtomNode } from './AtomNode'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { UndoNotification } from './UndoNotification'
import type { UndoEntry } from './UndoNotification'
import { BondNameDialog } from './BondNameDialog'

interface GraphCanvasProps {
  data: GraphData
  selectedAtomId: string | null
  onSelectAtom: (id: string | null) => void
}

const nodeTypes = { atom: AtomNode }

export function GraphCanvas({ data, selectedAtomId, onSelectAtom }: GraphCanvasProps) {
  const { atoms, loading, error, createAtom, deleteAtom, addBond, removeBond } = data

  const initialNodes: Node[] = []
  const initialEdges: Edge[] = []
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Atom | null>(null)
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null)

  useEffect(() => {
    setNodes((prev) => mergeNodePositions(atomsToNodes(atoms), prev))
    setEdges(atomsToEdges(atoms))
  }, [atoms, setNodes, setEdges])

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
    const parts = edgeId.split('-')
    if (parts.length < 3) return
    // Edge id format: sourceUuid-targetUuid-bondName (UUIDs contain dashes)
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
        await createAtom(
          entry.atom.properties.nuclearies.title,
          entry.atom.labels,
        )
      } else if (entry.bond) {
        await addBond(
          entry.atom.properties.shellies.uuid,
          entry.bond.uuid,
          entry.bond.name,
        )
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
    }
  }, [selectedAtomId, edges, handleDeleteRequest, handleEdgeDelete])

  const pendingSource = useMemo(() =>
    pendingConnection ? atoms.find((a) => a.properties.shellies.uuid === pendingConnection.source) : null,
    [pendingConnection, atoms],
  )
  const pendingTarget = useMemo(() =>
    pendingConnection ? atoms.find((a) => a.properties.shellies.uuid === pendingConnection.target) : null,
    [pendingConnection, atoms],
  )

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading graph…</div>
  }

  if (error) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'red' }}>{error}</div>
  }

  return (
    <div style={{ width: '100%', height: '100%' }} onKeyDown={onKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDoubleClick={handleDoubleClick}
        fitView
        deleteKeyCode={null}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {confirmDelete && (
        <DeleteConfirmDialog
          atomTitle={confirmDelete.properties.nuclearies.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {pendingConnection && pendingSource && pendingTarget && (
        <BondNameDialog
          sourceTitle={pendingSource.properties.nuclearies.title}
          targetTitle={pendingTarget.properties.nuclearies.title}
          onConfirm={handleBondConfirm}
          onCancel={() => setPendingConnection(null)}
        />
      )}

      {undoEntry && (
        <UndoNotification
          entry={undoEntry}
          onUndo={handleUndo}
          onExpire={() => setUndoEntry(null)}
        />
      )}
    </div>
  )
}
