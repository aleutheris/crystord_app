export type GraphView = 'network' | 'flow'

interface GraphViewTabsProps {
  activeView: GraphView
  onViewChange: (view: GraphView) => void
}

const VIEWS: GraphView[] = ['network', 'flow']
const LABELS: Record<GraphView, string> = { network: 'Network', flow: 'Flow' }

export function GraphViewTabs({ activeView, onViewChange }: GraphViewTabsProps) {
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const next = VIEWS[(VIEWS.indexOf(activeView) + 1) % VIEWS.length]!
      onViewChange(next)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const prev = VIEWS[(VIEWS.indexOf(activeView) - 1 + VIEWS.length) % VIEWS.length]!
      onViewChange(prev)
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Graph view"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        borderBottom: '1px solid #D6DEE5',
        backgroundColor: '#F3F6F8',
        padding: '0 0.5rem',
        flexShrink: 0,
      }}
    >
      {VIEWS.map((view) => (
        <button
          key={view}
          id={`tab-${view}`}
          role="tab"
          type="button"
          aria-selected={activeView === view}
          aria-controls="tabpanel-graph"
          tabIndex={activeView === view ? 0 : -1}
          onClick={() => onViewChange(view)}
          style={{
            padding: '0.4rem 1rem',
            border: 'none',
            borderBottom: activeView === view ? '2px solid #0066CC' : '2px solid transparent',
            background: 'transparent',
            color: activeView === view ? '#0066CC' : '#5B6B7A',
            fontWeight: activeView === view ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.85rem',
            outline: 'none',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px #0066CC' }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
        >
          {LABELS[view]}
        </button>
      ))}
    </div>
  )
}
