import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useAuth } from '../features/auth-entry'
import { GraphCanvas, useGraphData, DeleteConfirmDialog } from '../features/workspace-graph'
import { DetailPanel } from '../features/workspace-details'
import { SearchBar, QuerySummary, SearchResultPanel, useSearch } from '../features/workspace-search'

export function WorkspaceShell() {
  const { signOut } = useAuth()
  const graphData = useGraphData()
  const search = useSearch(graphData.atoms, graphData.refetch)
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const displayAtoms = search.isActive ? search.filteredAtoms : graphData.atoms
  const displayData = { ...graphData, atoms: displayAtoms }

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
        <SearchBar search={search} />
        <button type="button" onClick={signOut} style={{ padding: '0.25rem 0.75rem', flexShrink: 0 }}>
          Sign Out
        </button>
      </header>
      <QuerySummary summary={search.querySummary} resultCount={search.filteredAtoms.length} />
      <ReactFlowProvider>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {search.isActive && (
            <SearchResultPanel
              atoms={search.filteredAtoms}
              selectedAtomId={selectedAtomId}
              onSelectAtom={setSelectedAtomId}
            />
          )}
          <div style={{ flex: 1, position: 'relative' }}>
            <GraphCanvas
              data={displayData}
              selectedAtomId={selectedAtomId}
              onSelectAtom={setSelectedAtomId}
            />
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
