import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface AtomNodeData {
  title: string
  labels: string[]
  isNonFlowAtom?: boolean
  [key: string]: unknown
}

export function AtomNode({ data, selected }: NodeProps) {
  const { title, labels, isNonFlowAtom } = data as AtomNodeData
  const labelList = labels.join(', ')
  const tooltip = labelList ? `${title} [${labelList}]` : title

  const borderColor = selected ? '#0066CC' : '#D6DEE5'
  const borderWidth = selected ? 2 : 1
  const borderStyle = isNonFlowAtom ? 'dashed' : 'solid'

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div
        title={tooltip}
        aria-label={tooltip}
        style={{
          padding: '8px 14px',
          borderRadius: 6,
          border: `${borderWidth}px ${borderStyle} ${borderColor}`,
          background: selected ? '#E8F4FF' : '#FAFBFC',
          minWidth: 100,
          textAlign: 'center',
          cursor: 'grab',
          opacity: isNonFlowAtom ? 0.55 : 1,
        }}
      >
        <div style={{ fontWeight: selected ? 700 : 600, fontSize: '0.85rem', color: '#17202A' }}>{title}</div>
        {labels.length > 0 && (
          <div style={{ fontSize: '0.7rem', color: '#5B6B7A', marginTop: 2 }}>
            {labelList}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  )
}
