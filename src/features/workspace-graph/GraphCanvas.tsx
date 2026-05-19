import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Node, Edge } from '@xyflow/react'
import type { GraphData } from './use-graph-data'
import { atomsToNodes, atomsToFlowEdges, mergeNodePositions } from './graph-types'
import { FLOW_ELIGIBLE_BONDS, projectFlowAtoms } from './flow-projection'
import { applyFlowLayout } from './use-flow-layout'
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

export function GraphCanvas({ data, selectedAtomId, onSelectAtom }: GraphCanvasProps) {
  const { atoms, loading, error, createAtom, deleteAtom, addBond, removeBond } = data

  // Project to eligible flow bonds only; memoized so layout reruns only when atoms change (D1 / REQ-FR-260044)
  const eligibleSet = useMemo(() => new Set(FLOW_ELIGIBLE_BONDS), [])
  const projectedAtoms = useMemo(() => projectFlowAtoms(atoms, eligibleSet), [atoms, eligibleSet])
  const flowEdges = useMemo(() => atomsToFlowEdges(projectedAtoms, eligibleSet), [projectedAtoms, eligibleSet])

  // Memoize LR layout so applyFlowLayout only reruns when projected atoms change,
  // not on every selectedAtomId change (D3 / REQ-FR-260045).
  const rawNodes = useMemo(() => atomsToNodes(projectedAtoms), [projectedAtoms])
  const laidNodes = useMemo(() => applyFlowLayout(rawNodes, flowEdges), [rawNodes, flowEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    setEdges(flowEdges)
  }, [flowEdges, setEdges])

  // Merges drag-preserved positions and syncs selected state without re-running layout (D3 / REQ-FR-260045)
  useEffect(() => {
    setNodes((prev) => {
      const merged = mergeNodePositions(laidNodes, prev)
      return merged.map((n) => ({ ...n, selected: n.id === selectedAtomId }))
    })
  }, [laidNodes, selectedAtomId, setNodes])

  // Relayout preserves selectedAtomId and allows manual repositioning afterward (D3 / REQ-FR-260045)
  function handleRelayout() {
    setNodes(
      applyFlowLayout(rawNodes, flowEdges)
        .map((n) => ({ ...n, selected: n.id === selectedAtomId })),
    )
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
        <Panel position="top-right">
          <button
            type="button"
            onClick={handleRelayout}
            aria-label="Re-layout flow graph"
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
