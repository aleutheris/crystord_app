import { BaseEdge, useInternalNode } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { floatingEdgePath } from './graph-geometry'

export function FloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const sw = sourceNode.measured.width ?? 80
  const sh = sourceNode.measured.height ?? 80
  const tw = targetNode.measured.width ?? 80
  const th = targetNode.measured.height ?? 80

  const edgePath = floatingEdgePath(
    {
      x: sourceNode.internals.positionAbsolute.x + sw / 2,
      y: sourceNode.internals.positionAbsolute.y + sh / 2,
      radius: sw / 2,
    },
    {
      x: targetNode.internals.positionAbsolute.x + tw / 2,
      y: targetNode.internals.positionAbsolute.y + th / 2,
      radius: tw / 2,
    },
  )

  if (!edgePath) return null

  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
}
