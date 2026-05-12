import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

const NODE_SIZE = 80

interface CircleAtomNodeData {
  title: string
  labels: string[]
  [key: string]: unknown
}

export function CircleAtomNode({ data, selected }: NodeProps) {
  const { title } = data as CircleAtomNodeData

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: '50%',
          border: selected ? '2px solid #0066CC' : '1px solid #D6DEE5',
          background: selected ? '#E8F4FF' : '#FAFBFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          textAlign: 'center',
          padding: 8,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: '0.72rem',
            color: '#17202A',
            wordBreak: 'break-word',
            lineHeight: 1.2,
            display: 'block',
          }}
        >
          {title}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 10,
          height: 10,
          background: '#0066CC',
          border: '2px solid #fff',
        }}
      />
    </>
  )
}
