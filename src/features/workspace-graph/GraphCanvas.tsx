import { useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Node, Edge } from '@xyflow/react'
import type { GraphData } from './use-graph-data'
import { atomsToNodes, atomsToEdges, mergeNodePositions } from './graph-types'
import { AtomNode } from './AtomNode'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { UndoNotification } from './UndoNotification'
import { BondNameDialog } from './BondNameDialog'
import { useCanvasInteractions } from './use-canvas-interactions'

export interface GraphCanvasProps {
  data: GraphData
  selectedAtomId: string | null
  onSelectAtom: (id: string | null) => void
  renderMode?: 'full' | 'reduced'
}

const nodeTypes = { atom: AtomNode }

export function GraphCanvas({ data, selectedAtomId, onSelectAtom, renderMode = 'full' }: GraphCanvasProps) {
  const { atoms, loading, error, createAtom, deleteAtom, addBond, removeBond } = data

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    setNodes((prev) => mergeNodePositions(atomsToNodes(atoms), prev))
    const rawEdges = atomsToEdges(atoms)
    setEdges(renderMode === 'reduced' ? rawEdges.map((e) => ({ ...e, label: undefined })) : rawEdges)
  }, [atoms, renderMode, setNodes, setEdges])

  const ix = useCanvasInteractions({ atoms, edges, selectedAtomId, onSelectAtom, deleteAtom, createAtom, addBond, removeBond })

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading graph…</div>
  }

  if (error) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'red' }}>{error}</div>
  }

  return (
    <div
      role="region"
      aria-label="Flow view graph canvas"
      tabIndex={0}
      style={{ width: '100%', height: '100%', outline: 'none' }}
      onKeyDown={ix.onKeyDown}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={ix.onConnect}
        onNodeClick={ix.onNodeClick}
        onPaneClick={ix.onPaneClick}
        onDoubleClick={ix.handleDoubleClick}
        fitView
        deleteKeyCode={null}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {ix.confirmDelete && (
        <DeleteConfirmDialog
          atomTitle={ix.confirmDelete.properties.nuclearies.title}
          onConfirm={ix.handleDeleteConfirm}
          onCancel={() => ix.setConfirmDelete(null)}
        />
      )}

      {ix.pendingConnection && ix.pendingSource && ix.pendingTarget && (
        <BondNameDialog
          sourceTitle={ix.pendingSource.properties.nuclearies.title}
          targetTitle={ix.pendingTarget.properties.nuclearies.title}
          onConfirm={ix.handleBondConfirm}
          onCancel={() => ix.setPendingConnection(null)}
        />
      )}

      {ix.undoEntry && (
        <UndoNotification
          entry={ix.undoEntry}
          onUndo={ix.handleUndo}
          onExpire={() => ix.setUndoEntry(null)}
        />
      )}
    </div>
  )
}
