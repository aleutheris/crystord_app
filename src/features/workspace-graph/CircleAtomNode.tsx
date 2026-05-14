import { useState, useRef } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import {
  RING_COLOR,
  SELECTION_BORDER_COLOR,
  SELECTION_BG_COLOR,
  DEFAULT_BORDER_COLOR,
} from './network-tokens'

export const RING_THICKNESS = 8      // outer ring interactive thickness (px) — D1 / ADR-260036
export const CLICK_DRAG_THRESHOLD = 4  // min pointer movement (px) to distinguish click from drag — D3 / ADR-260036

const NODE_SIZE = 80
const invisibleHandle: React.CSSProperties = { opacity: 0, pointerEvents: 'none' }

interface CircleAtomNodeData {
  title: string
  labels: string[]
  [key: string]: unknown
}

export function CircleAtomNode({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { title, labels } = data as CircleAtomNodeData
  const labelList = (labels as string[]).join(', ')
  const tooltip = labelList ? `${title} [${labelList}]` : title
  const ringVisible = hovered || !!selected

  function scheduleHide() {
    hideTimerRef.current = setTimeout(() => setHovered(false), 50)
  }

  function cancelHide() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  return (
    <>
      {/* Invisible target handles on all four sides for nearest-boundary edge anchoring */}
      <Handle type="target" id="top" position={Position.Top} style={invisibleHandle} />
      <Handle type="target" id="right" position={Position.Right} style={invisibleHandle} />
      <Handle type="target" id="bottom" position={Position.Bottom} style={invisibleHandle} />
      <Handle type="target" id="left" position={Position.Left} style={invisibleHandle} />

      {/* Outer ring — full-circumference edge-initiation affordance (D1–D3 / ADR-260036) */}
      <Handle
        id="ring"
        type="source"
        position={Position.Left}
        data-testid="ring-handle"
        aria-label="Drag from ring to create a relationship"
        onMouseEnter={() => { cancelHide(); setHovered(true) }}
        onMouseLeave={scheduleHide}
        style={{
          position: 'absolute',
          top: -RING_THICKNESS,
          left: -RING_THICKNESS,
          width: NODE_SIZE + 2 * RING_THICKNESS,
          height: NODE_SIZE + 2 * RING_THICKNESS,
          borderRadius: '50%',
          border: `${RING_THICKNESS}px solid ${RING_COLOR}`,
          background: 'transparent',
          opacity: ringVisible ? 1 : 0,
          pointerEvents: ringVisible ? 'all' : 'none',
          cursor: 'crosshair',
          boxSizing: 'border-box',
          zIndex: 1,
          transform: 'none',
        }}
      />

      {/* Inner node body — primary drag surface for atom movement (D3 / ADR-260036) */}
      <div
        data-testid="circle-node-body"
        title={tooltip}
        aria-label={tooltip}
        onMouseEnter={() => { cancelHide(); setHovered(true) }}
        onMouseLeave={scheduleHide}
        style={{
          position: 'relative',
          zIndex: 2,
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: '50%',
          border: selected ? `3px solid ${SELECTION_BORDER_COLOR}` : `1px solid ${DEFAULT_BORDER_COLOR}`,
          background: selected ? SELECTION_BG_COLOR : '#FAFBFC',
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
    </>
  )
}
