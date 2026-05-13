export interface CircleCenter {
  x: number
  y: number
  radius: number
}

export function floatingEdgePath(source: CircleCenter, target: CircleCenter): string | null {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 1) return null

  const nx = dx / dist
  const ny = dy / dist

  const x1 = source.x + nx * source.radius
  const y1 = source.y + ny * source.radius
  const x2 = target.x - nx * target.radius
  const y2 = target.y - ny * target.radius

  return `M ${x1} ${y1} L ${x2} ${y2}`
}
