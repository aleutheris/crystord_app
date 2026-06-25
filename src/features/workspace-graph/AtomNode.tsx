import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { C_PRIMARY, C_BORDER, C_SELECTION_BG, C_BG, C_TEXT, C_TEXT_SECONDARY } from '../../styles/tokens'

interface AtomNodeData {
  title: string
  labels: string[]
  isNonFlowAtom?: boolean
  canBond?: boolean
  [key: string]: unknown
}

export function AtomNode({ data, selected }: NodeProps) {
  const { title, labels, isNonFlowAtom, canBond } = data as AtomNodeData
  const labelList = labels.join(', ')
  const tooltip = labelList ? `${title} [${labelList}]` : title
  // Read-side gating: expose the bond-create source handle only when explicitly bondable (fail-closed —
  // a node missing the flag shows no affordance, and onConnect blocks the bond regardless).
  const showBondHandle = canBond === true

  const borderColor = selected ? C_PRIMARY : C_BORDER
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
          background: selected ? C_SELECTION_BG : C_BG,
          minWidth: 100,
          textAlign: 'center',
          cursor: 'grab',
          opacity: isNonFlowAtom ? 0.55 : 1,
        }}
      >
        <div style={{ fontWeight: selected ? 700 : 600, fontSize: '0.85rem', color: C_TEXT }}>{title}</div>
        {labels.length > 0 && (
          <div style={{ fontSize: '0.7rem', color: C_TEXT_SECONDARY, marginTop: 2 }}>
            {labelList}
          </div>
        )}
      </div>
      {showBondHandle && <Handle type="source" position={Position.Right} />}
    </>
  )
}
