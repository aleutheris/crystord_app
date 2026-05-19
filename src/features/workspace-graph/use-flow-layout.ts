import type { Node, Edge } from '@xyflow/react'

export const FLOW_LAYER_WIDTH = 240
export const FLOW_NODE_SPACING = 120

// Applies a left-to-right hierarchical layout using longest-path layer assignment (D1/D2 / ADR-260039).
// Cyclic subgraphs fall back to layer 0 — back-edges and unavoidable crossings are acceptable (D4).
export function applyFlowLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes

  const nodeIds = new Set(nodes.map((n) => n.id))

  const outEdges = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  for (const id of nodeIds) {
    outEdges.set(id, [])
    inDegree.set(id, 0)
  }

  for (const edge of edges) {
    const src = edge.source as string
    const tgt = edge.target as string
    if (src !== tgt && nodeIds.has(src) && nodeIds.has(tgt)) {
      outEdges.get(src)!.push(tgt)
      inDegree.set(tgt, (inDegree.get(tgt) ?? 0) + 1)
    }
  }

  // Longest-path layer assignment via Kahn's BFS
  const layer = new Map<string, number>()
  const tempDegree = new Map(inDegree)
  const queue: string[] = []

  for (const [id, deg] of tempDegree) {
    if (deg === 0) {
      queue.push(id)
      layer.set(id, 0)
    }
  }

  while (queue.length > 0) {
    const id = queue.shift()!
    const currentLayer = layer.get(id)!
    for (const tgt of (outEdges.get(id) ?? [])) {
      const nextLayer = currentLayer + 1
      if (nextLayer > (layer.get(tgt) ?? 0)) {
        layer.set(tgt, nextLayer)
      }
      tempDegree.set(tgt, (tempDegree.get(tgt) ?? 1) - 1)
      if (tempDegree.get(tgt) === 0) {
        queue.push(tgt)
      }
    }
  }

  // Nodes unreachable via BFS (cyclic) fall back to layer 0
  for (const id of nodeIds) {
    if (!layer.has(id)) layer.set(id, 0)
  }

  // Group nodes by layer and assign positions: x = layer column, y = centered within layer
  const layerGroups = new Map<number, string[]>()
  for (const id of nodeIds) {
    const l = layer.get(id)!
    if (!layerGroups.has(l)) layerGroups.set(l, [])
    layerGroups.get(l)!.push(id)
  }

  const posMap = new Map<string, { x: number; y: number }>()
  for (const [l, ids] of layerGroups) {
    const totalHeight = (ids.length - 1) * FLOW_NODE_SPACING
    ids.forEach((id, i) => {
      posMap.set(id, {
        x: l * FLOW_LAYER_WIDTH,
        y: i * FLOW_NODE_SPACING - totalHeight / 2,
      })
    })
  }

  return nodes.map((n) => ({ ...n, position: posMap.get(n.id) ?? n.position }))
}
