import { useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Node } from '@xyflow/react'
import type { Atom } from '../../api-contract/graph-queries'
import type { GraphData } from './use-graph-data'
import { atomsToEdges, mergeNodePositions } from './graph-types'
import { CircleAtomNode } from './CircleAtomNode'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { UndoNotification } from './UndoNotification'
import { BondNameDialog } from './BondNameDialog'
import { useCanvasInteractions } from './use-canvas-interactions'

export interface NetworkCanvasProps {
  data: GraphData
  selectedAtomId: string | null
  onSelectAtom: (id: string | null) => void
}

const NODE_SIZE = 80
const SPACING = 160

const nodeTypes = { circleAtom: CircleAtomNode }

function atomsToNetworkNodes(atoms: Atom[]): Node[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(atoms.length)))
  return atoms.map((atom, i) => ({
    id: atom.properties.shellies.uuid,
    type: 'circleAtom',
    position: { x: (i % cols) * SPACING, y: Math.floor(i / cols) * SPACING },
    data: { title: atom.properties.nuclearies.title, labels: atom.labels },
    style: { width: NODE_SIZE, height: NODE_SIZE },
  }))
}

export function NetworkCanvas({ data, selectedAtomId, onSelectAtom }: NetworkCanvasProps) {
  const { atoms, loading, error, createAtom, deleteAtom, addBond, removeBond } = data

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    setNodes((prev) => mergeNodePositions(atomsToNetworkNodes(atoms), prev))
    setEdges(atomsToEdges(atoms))
  }, [atoms, setNodes, setEdges])

  const ix = useCanvasInteractions({ atoms, edges, selectedAtomId, onSelectAtom, deleteAtom, createAtom, addBond, removeBond })

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading graph…</div>
  }

  if (error) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'red' }}>{error}</div>
  }

  return (
    <div style={{ width: '100%', height: '100%' }} onKeyDown={ix.onKeyDown}>
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
