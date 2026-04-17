import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useAuth } from '../features/auth-entry'
import { GraphCanvas, useGraphData } from '../features/workspace-graph'
import { DetailPanel } from '../features/workspace-details'

export function WorkspaceShell() {
  const { signOut } = useAuth()
  const graphData = useGraphData()
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null)

  const selectedAtom = graphData.atoms.find(
    (a) => a.properties.shellies.uuid === selectedAtomId,
  ) ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Crystord</h1>
        <button type="button" onClick={signOut} style={{ padding: '0.25rem 0.75rem' }}>
          Sign Out
        </button>
      </header>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <GraphCanvas
              data={graphData}
              selectedAtomId={selectedAtomId}
              onSelectAtom={setSelectedAtomId}
            />
          </ReactFlowProvider>
        </div>
        {selectedAtom && (
          <DetailPanel
            key={selectedAtom.properties.shellies.uuid}
            atom={selectedAtom}
            onUpdate={graphData.updateAtom}
            onDelete={(id) => {
              const atom = graphData.atoms.find((a) => a.properties.shellies.uuid === id)
              if (atom) {
                setSelectedAtomId(null)
                void graphData.deleteAtom(id)
              }
            }}
            onClose={() => setSelectedAtomId(null)}
          />
        )}
      </div>
    </div>
  )
}
