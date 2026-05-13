import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force'
import type { Node, Edge } from '@xyflow/react'
import { BLOCKED_THRESHOLD } from './use-graph-degrade'

export const FORCE_TICK_COUNT = 300
export const FORCE_MIN_SEPARATION = 100  // NODE_SIZE (80) + 20px padding

interface ForceNode extends SimulationNodeDatum {
  id: string
}

type ForceLink = SimulationLinkDatum<ForceNode> & { source: string; target: string }

export function applyForceLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes
  if (nodes.length > BLOCKED_THRESHOLD) return nodes  // grid fallback per D4

  const simNodes: ForceNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
  }))

  const nodeIds = new Set(simNodes.map((n) => n.id))

  // Exclude self-loops (D5) and edges referencing nodes absent from the current result set
  const simLinks: ForceLink[] = edges
    .filter((e) => e.source !== e.target)
    .filter((e) => nodeIds.has(e.source as string) && nodeIds.has(e.target as string))
    .map((e) => ({ source: e.source as string, target: e.target as string }))

  forceSimulation<ForceNode>(simNodes)
    .force('link', forceLink<ForceNode, ForceLink>(simLinks).id((d) => d.id).distance(FORCE_MIN_SEPARATION))
    .force('charge', forceManyBody().strength(-200))
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide<ForceNode>(FORCE_MIN_SEPARATION / 2))
    .stop()
    .tick(FORCE_TICK_COUNT)

  const posMap = new Map(simNodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]))

  return nodes.map((n) => ({ ...n, position: posMap.get(n.id) ?? n.position }))
}
