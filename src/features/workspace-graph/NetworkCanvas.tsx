import { useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Node, Edge } from '@xyflow/react'
import type { Atom } from '../../api-contract/graph-queries'
import type { GraphData } from './use-graph-data'
import { atomsToNetworkEdges, mergeNodePositions } from './graph-types'
import { applyForceLayout } from './use-network-layout'
import { CircleAtomNode } from './CircleAtomNode'
import { FloatingEdge } from './FloatingEdge'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { UndoNotification } from './UndoNotification'
import { BondNameDialog } from './BondNameDialog'
import { useCanvasInteractions } from './use-canvas-interactions'

export interface NetworkCanvasProps {
  data: GraphData
  selectedAtomId: string | null
  onSelectAtom: (id: string | null) => void
  renderMode?: 'full' | 'reduced'
}

const NODE_SIZE = 80
const SPACING = 160
const CIRCLE_DROP_RADIUS = 42  // node radius (40) + 2px margin — covers full circle drop zone (D4 / ADR-260036)

const nodeTypes = { circleAtom: CircleAtomNode }
const edgeTypes = { floating: FloatingEdge }

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

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    const networkEdges = atomsToNetworkEdges(atoms)
    const laidOut = applyForceLayout(atomsToNetworkNodes(atoms), networkEdges)
    setNodes((prev) => mergeNodePositions(laidOut, prev))
    setEdges(networkEdges)
  }, [atoms, setNodes, setEdges])

  function handleRelayout() {
    setNodes(applyForceLayout(atomsToNetworkNodes(atoms), atomsToNetworkEdges(atoms)))
  }

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
      aria-label="Network view graph canvas"
      tabIndex={0}
      style={{ width: '100%', height: '100%', outline: 'none' }}
      onKeyDown={ix.onKeyDown}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={ix.onConnect}
        onNodeClick={ix.onNodeClick}
        onPaneClick={ix.onPaneClick}
        onDoubleClick={ix.handleDoubleClick}
        connectionRadius={CIRCLE_DROP_RADIUS}
        connectionLineType={ConnectionLineType.Straight}
        fitView
        deleteKeyCode={null}
      >
        <Background />
        <Controls />
        <Panel position="top-right">
          <button
            type="button"
            onClick={handleRelayout}
            aria-label="Re-layout graph"
            style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
          >
            Re-layout
          </button>
        </Panel>
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
