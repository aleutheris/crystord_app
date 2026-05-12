import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

const NODE_SIZE = 80
const invisibleHandle: React.CSSProperties = { opacity: 0, pointerEvents: 'none' }

interface CircleAtomNodeData {
  title: string
  labels: string[]
  [key: string]: unknown
}

export function CircleAtomNode({ data, selected }: NodeProps) {
  const { title, labels } = data as CircleAtomNodeData
  const labelList = (labels as string[]).join(', ')
  const tooltip = labelList ? `${title} [${labelList}]` : title

  return (
    <>
      {/* Invisible target handles on all four sides for nearest-boundary edge anchoring */}
      <Handle type="target" id="top" position={Position.Top} style={invisibleHandle} />
      <Handle type="target" id="right" position={Position.Right} style={invisibleHandle} />
      <Handle type="target" id="bottom" position={Position.Bottom} style={invisibleHandle} />
      <Handle type="target" id="left" position={Position.Left} style={invisibleHandle} />
      <div
        data-testid="circle-node-body"
        title={tooltip}
        aria-label={tooltip}
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: '50%',
          border: selected ? '3px solid #0066CC' : '1px solid #D6DEE5',
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
            fontWeight: selected ? 700 : 600,
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
      {/* Visible connector dot — the drag affordance for creating relationships */}
      <Handle
        id="connector"
        type="source"
        position={Position.Right}
        data-testid="connector-handle"
        aria-label="Drag to create a relationship"
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
