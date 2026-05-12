import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useAuth } from '../features/auth-entry'
import { GraphCanvas, NetworkCanvas, useGraphData, DeleteConfirmDialog } from '../features/workspace-graph'
import { DetailPanel } from '../features/workspace-details'
import { SearchBar, QuerySummary, SearchResultPanel, useSearch, useRecommendedLabels } from '../features/workspace-search'
import { GraphViewTabs } from './GraphViewTabs'
import type { GraphView } from './GraphViewTabs'

export function WorkspaceShell() {
  const { signOut } = useAuth()
  const graphData = useGraphData()
  const search = useSearch(graphData.atoms, graphData.search)
  const recommendedLabels = useRecommendedLabels()
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<GraphView>('network')

  const selectedAtom = graphData.atoms.find(
    (a) => a.properties.shellies.uuid === selectedAtomId,
  ) ?? null

  const pendingDeleteAtom = pendingDeleteId
    ? graphData.atoms.find((a) => a.properties.shellies.uuid === pendingDeleteId) ?? null
    : null

  function handleDeleteConfirm() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    setSelectedAtomId(null)
    void graphData.deleteAtom(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', flexShrink: 0 }}>Crystord</h1>
        <SearchBar search={search} recommendedLabels={recommendedLabels} />
        <button type="button" onClick={signOut} style={{ padding: '0.25rem 0.75rem', flexShrink: 0 }}>
          Sign Out
        </button>
      </header>
      <QuerySummary summary={search.querySummary} resultCount={graphData.atoms.length} />
      <ReactFlowProvider>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {search.querySummary.length > 0 && (
            <SearchResultPanel
              atoms={graphData.atoms}
              selectedAtomId={selectedAtomId}
              onSelectAtom={setSelectedAtomId}
            />
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <GraphViewTabs activeView={activeView} onViewChange={setActiveView} />
            <div style={{ flex: 1, position: 'relative' }}>
              {activeView === 'network' ? (
                <NetworkCanvas
                  data={graphData}
                  selectedAtomId={selectedAtomId}
                  onSelectAtom={setSelectedAtomId}
                />
              ) : (
                <GraphCanvas
                  data={graphData}
                  selectedAtomId={selectedAtomId}
                  onSelectAtom={setSelectedAtomId}
                />
              )}
            </div>
          </div>
          {selectedAtom && (
            <DetailPanel
              key={selectedAtom.properties.shellies.uuid}
              atom={selectedAtom}
              onUpdate={graphData.updateAtom}
              onDelete={(id) => setPendingDeleteId(id)}
              onClose={() => setSelectedAtomId(null)}
            />
          )}
        </div>
      </ReactFlowProvider>
      {pendingDeleteAtom && (
        <DeleteConfirmDialog
          atomTitle={pendingDeleteAtom.properties.nuclearies.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  )
}
