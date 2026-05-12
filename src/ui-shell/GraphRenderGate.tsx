import type { RenderMode } from '../features/workspace-graph'
import { BLOCKED_THRESHOLD } from '../features/workspace-graph'

interface GraphRenderGateProps {
  atomCount: number
  mode: RenderMode
  onConfirm: () => void
  children: React.ReactNode
}

export function GraphRenderGate({ atomCount, mode, onConfirm, children }: GraphRenderGateProps) {
  if (mode === 'blocked') {
    return (
      <div
        role="status"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#17202A', fontSize: '0.95rem', maxWidth: 420, margin: 0 }}>
          This search returned <strong>{atomCount} nodes</strong>, which exceeds the{' '}
          {BLOCKED_THRESHOLD}-node threshold and may impact performance.
        </p>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            padding: '0.5rem 1.25rem',
            background: '#0066CC',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          Render anyway
        </button>
      </div>
    )
  }

  return <>{children}</>
}
