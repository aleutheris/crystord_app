import type { ConnectionLineComponentProps } from '@xyflow/react'

// Half of NODE_SIZE (80) — boundary radius for nearest-boundary snap geometry (D3 / ADR-260038, REQ-FR-260041)
export const CONNECTION_LINE_NODE_RADIUS = 40

export function NetworkConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  toNode,
}: ConnectionLineComponentProps) {
  let endX = toX
  let endY = toY

  if (toNode !== null) {
    // Snap endpoint to nearest boundary of target circle along source-target direction (D3 / ADR-260038)
    const dx = fromX - toX
    const dy = fromY - toY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 0) {
      endX = toX + (dx / dist) * CONNECTION_LINE_NODE_RADIUS
      endY = toY + (dy / dist) * CONNECTION_LINE_NODE_RADIUS
    }
  }

  return (
    <path
      data-testid="connection-line-path"
      d={`M ${fromX},${fromY} L ${endX},${endY}`}
      fill="none"
      strokeWidth={1.5}
      stroke="#b1b1b7"
    />
  )
}
