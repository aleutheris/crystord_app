import { useState } from 'react'
import type { GraphView } from './GraphViewTabs'

interface GraphLegendProps {
  view: GraphView
}

const NODE_LABEL: Record<GraphView, string> = {
  network: 'Circle = atom (data entity)',
  flow: 'Rectangle = atom (data entity)',
}

export function GraphLegend({ view }: GraphLegendProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      aria-label="Graph legend"
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 10,
        background: '#FAFBFC',
        border: '1px solid #D6DEE5',
        borderRadius: 6,
        fontSize: '0.75rem',
        color: '#17202A',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        minWidth: 180,
      }}
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-controls="graph-legend-body"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: '100%',
          padding: '0.3rem 0.6rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontWeight: 600,
          fontSize: '0.75rem',
          color: '#5B6B7A',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        Legend
        <span aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && (
        <dl
          id="graph-legend-body"
          style={{ margin: 0, padding: '0 0.6rem 0.5rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.15rem 0.5rem' }}
        >
          <dt style={{ fontWeight: 600, color: '#5B6B7A', whiteSpace: 'nowrap' }}>Node</dt>
          <dd style={{ margin: 0 }}>{NODE_LABEL[view]}</dd>

          <dt style={{ fontWeight: 600, color: '#5B6B7A' }}>Edge</dt>
          <dd style={{ margin: 0 }}>Line = bond (relationship)</dd>

          {view === 'network' && (
            <>
              <dt style={{ fontWeight: 600, color: '#5B6B7A', whiteSpace: 'nowrap' }}>Blue dot</dt>
              <dd style={{ margin: 0 }}>Drag to create a relationship</dd>
            </>
          )}

          <dt style={{ fontWeight: 600, color: '#5B6B7A' }}>Selected</dt>
          <dd style={{ margin: 0 }}>Bold outline + highlighted background</dd>
        </dl>
      )}
    </div>
  )
}
