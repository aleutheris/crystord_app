import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface AtomNodeData {
  title: string
  labels: string[]
  [key: string]: unknown
}

export function AtomNode({ data, selected }: NodeProps) {
  const { title, labels } = data as AtomNodeData

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          padding: '8px 14px',
          borderRadius: 6,
          border: selected ? '2px solid #1a73e8' : '1px solid #ccc',
          background: selected ? '#e8f0fe' : '#fff',
          minWidth: 100,
          textAlign: 'center',
          cursor: 'grab',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</div>
        {labels.length > 0 && (
          <div style={{ fontSize: '0.7rem', color: '#666', marginTop: 2 }}>
            {labels.join(', ')}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
