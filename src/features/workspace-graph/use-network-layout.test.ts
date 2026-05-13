import { describe, it, expect } from 'vitest'
import { applyForceLayout, FORCE_TICK_COUNT } from './use-network-layout'
import { BLOCKED_THRESHOLD } from './use-graph-degrade'
import type { Node, Edge } from '@xyflow/react'

function makeNode(id: string, x = 0, y = 0): Node {
  return { id, type: 'circleAtom', position: { x, y }, data: {} }
}

function makeEdge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target }
}

describe('applyForceLayout', () => {
  it('returns empty array for empty input', () => {
    expect(applyForceLayout([], [])).toEqual([])
  })

  it('returns nodes unchanged when count exceeds BLOCKED_THRESHOLD (grid fallback)', () => {
    const nodes = Array.from({ length: BLOCKED_THRESHOLD + 1 }, (_, i) =>
      makeNode(`n${i}`, i * 10, 0),
    )
    const result = applyForceLayout(nodes, [])
    expect(result).toHaveLength(nodes.length)
    expect(result[0]!.position).toEqual(nodes[0]!.position)
  })

  it('returns the same number of nodes after simulation', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 100, 0), makeNode('c', 200, 0)]
    const result = applyForceLayout(nodes, [makeEdge('a', 'b'), makeEdge('b', 'c')])
    expect(result).toHaveLength(3)
  })

  it('produces valid (non-NaN) positions for all nodes after simulation', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 200, 0), makeNode('c', 100, 100)]
    const edges = [makeEdge('a', 'b'), makeEdge('b', 'c')]
    const result = applyForceLayout(nodes, edges)
    for (const node of result) {
      expect(Number.isNaN(node.position.x)).toBe(false)
      expect(Number.isNaN(node.position.y)).toBe(false)
    }
  })

  it('excludes self-loop edges so NaN positions do not occur', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 100, 0)]
    const edges = [makeEdge('a', 'a'), makeEdge('a', 'b')]
    const result = applyForceLayout(nodes, edges)
    for (const node of result) {
      expect(Number.isNaN(node.position.x)).toBe(false)
      expect(Number.isNaN(node.position.y)).toBe(false)
    }
  })

  it('FORCE_TICK_COUNT is 300 (synchronous iteration cap)', () => {
    expect(FORCE_TICK_COUNT).toBe(300)
  })
})
