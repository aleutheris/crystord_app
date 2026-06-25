import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useLogout, useAuth } from '../features/auth-entry'
import { AccountSettingsPanel } from '../features/account-settings'
import { GraphCanvas, NetworkCanvas, useGraphData, DeleteConfirmDialog, useGraphDegrade } from '../features/workspace-graph'
import { DetailPanel, CreationNotification } from '../features/workspace-details'
import { SearchBar, QuerySummary, SearchResultPanel, useSearch, useRecommendedLabels } from '../features/workspace-search'
import { AtomCreationOverlay } from './AtomCreationOverlay'
import { BetaBanner } from './BetaBanner'
import { GraphViewTabs } from './GraphViewTabs'
import { GraphRenderGate } from './GraphRenderGate'
import { GraphLegend } from './GraphLegend'
import type { GraphView } from './GraphViewTabs'
import { networkViewEnabled } from '../feature-flags'
import { ThemeToggle } from '../styles/ThemeToggle'
import { C_BORDER } from '../styles/tokens'

export function WorkspaceShell({ googleClientId }: { googleClientId?: string }) {
  const logout = useLogout()
  const { signOut } = useAuth()
  const graphData = useGraphData()
  const search = useSearch(graphData.atoms, graphData.search)
  const recommendedLabels = useRecommendedLabels()
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<GraphView>(networkViewEnabled ? 'network' : 'flow')
  const { mode: renderMode, confirmRender } = useGraphDegrade(graphData.atoms.length)
  const [isCreatingAtom, setIsCreatingAtom] = useState(false)
  const [creationSuccessMsg, setCreationSuccessMsg] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const canvasMode = renderMode === 'full' ? 'full' : 'reduced'

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

  async function handleCreateAtom(title: string, labels: string[], description: string, content: string) {
    await graphData.createAtom(title, labels, { description, content })
    setIsCreatingAtom(false)
    setCreationSuccessMsg(`Atom "${title}" created successfully.`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <BetaBanner />
      <header style={{ padding: '0.5rem 1rem', borderBottom: `1px solid ${C_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', flexShrink: 0 }}>Crystord</h1>
        <SearchBar search={search} recommendedLabels={recommendedLabels} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <ThemeToggle />
          <button type="button" onClick={() => setIsSettingsOpen(true)} style={{ padding: '0.25rem 0.75rem' }}>
            Account
          </button>
          <button type="button" onClick={logout} style={{ padding: '0.25rem 0.75rem' }}>
            Sign Out
          </button>
        </div>
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
            {networkViewEnabled && <GraphViewTabs activeView={activeView} onViewChange={setActiveView} />}
            <div
              id="tabpanel-graph"
              role="tabpanel"
              aria-labelledby={`tab-${activeView}`}
              style={{ flex: 1, position: 'relative' }}
            >
              <GraphLegend view={activeView} />
              <GraphRenderGate
                atomCount={graphData.atoms.length}
                mode={renderMode}
                onConfirm={confirmRender}
              >
                {activeView === 'network' ? (
                  <NetworkCanvas
                    data={graphData}
                    selectedAtomId={selectedAtomId}
                    onSelectAtom={setSelectedAtomId}
                    onCreateAtom={() => setIsCreatingAtom(true)}
                    renderMode={canvasMode}
                  />
                ) : (
                  <GraphCanvas
                    data={graphData}
                    selectedAtomId={selectedAtomId}
                    onSelectAtom={setSelectedAtomId}
                    onCreateAtom={() => setIsCreatingAtom(true)}
                    renderMode={canvasMode}
                  />
                )}
              </GraphRenderGate>
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
      {isCreatingAtom && (
        <AtomCreationOverlay
          onCreate={handleCreateAtom}
          onClose={() => setIsCreatingAtom(false)}
        />
      )}
      {creationSuccessMsg && (
        <CreationNotification
          message={creationSuccessMsg}
          onExpire={() => setCreationSuccessMsg(null)}
        />
      )}
      {isSettingsOpen && (
        <AccountSettingsPanel
          onClose={() => setIsSettingsOpen(false)}
          onSessionEnded={signOut}
          googleClientId={googleClientId}
        />
      )}
    </div>
  )
}
