export type GraphView = 'network' | 'flow'

interface GraphViewTabsProps {
  activeView: GraphView
  onViewChange: (view: GraphView) => void
}

export function GraphViewTabs({ activeView, onViewChange }: GraphViewTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Graph view"
      style={{
        display: 'flex',
        borderBottom: '1px solid #D6DEE5',
        backgroundColor: '#F3F6F8',
        padding: '0 0.5rem',
        flexShrink: 0,
      }}
    >
      {(['network', 'flow'] as const).map((view) => (
        <button
          key={view}
          role="tab"
          type="button"
          aria-selected={activeView === view}
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
          }}
        >
          {view === 'network' ? 'Network' : 'Flow'}
        </button>
      ))}
    </div>
  )
}
