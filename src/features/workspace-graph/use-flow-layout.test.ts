import { describe, it, expect } from 'vitest'
import { applyFlowLayout, FLOW_LAYER_WIDTH, FLOW_NODE_SPACING } from './use-flow-layout'
import type { Node, Edge } from '@xyflow/react'

function makeNode(id: string, x = 0, y = 0): Node {
  return { id, type: 'atom', position: { x, y }, data: {} }
}

function makeEdge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target }
}

describe('applyFlowLayout', () => {
  it('returns empty array for empty input', () => {
    expect(applyFlowLayout([], [])).toEqual([])
  })

  it('returns same number of nodes after layout', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')]
    const edges = [makeEdge('a', 'b'), makeEdge('b', 'c')]
    expect(applyFlowLayout(nodes, edges)).toHaveLength(3)
  })

  it('assigns source nodes to layer 0 (leftmost column)', () => {
    const nodes = [makeNode('src'), makeNode('tgt')]
    const edges = [makeEdge('src', 'tgt')]
    const result = applyFlowLayout(nodes, edges)
    const src = result.find((n) => n.id === 'src')!
    expect(src.position.x).toBe(0)
  })

  it('assigns downstream nodes to later layers (x increases left to right)', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')]
    const edges = [makeEdge('a', 'b'), makeEdge('b', 'c')]
    const result = applyFlowLayout(nodes, edges)
    const posA = result.find((n) => n.id === 'a')!.position.x
    const posB = result.find((n) => n.id === 'b')!.position.x
    const posC = result.find((n) => n.id === 'c')!.position.x
    expect(posA).toBeLessThan(posB)
    expect(posB).toBeLessThan(posC)
  })

  it('layer x spacing matches FLOW_LAYER_WIDTH', () => {
    const nodes = [makeNode('a'), makeNode('b')]
    const edges = [makeEdge('a', 'b')]
    const result = applyFlowLayout(nodes, edges)
    const posA = result.find((n) => n.id === 'a')!.position.x
    const posB = result.find((n) => n.id === 'b')!.position.x
    expect(posB - posA).toBe(FLOW_LAYER_WIDTH)
  })

  it('places isolated nodes (no edges) at layer 0', () => {
    const nodes = [makeNode('lone')]
    const result = applyFlowLayout(nodes, [])
    expect(result[0]!.position.x).toBe(0)
  })

  it('handles cyclic graphs without crashing (cycle nodes fall back to layer 0)', () => {
    const nodes = [makeNode('a'), makeNode('b')]
    const edges = [makeEdge('a', 'b'), makeEdge('b', 'a')]
    const result = applyFlowLayout(nodes, edges)
    for (const node of result) {
      expect(Number.isNaN(node.position.x)).toBe(false)
      expect(Number.isNaN(node.position.y)).toBe(false)
    }
  })

  it('uses longest-path for depth assignment (diamond shape)', () => {
    const nodes = [makeNode('root'), makeNode('left'), makeNode('right'), makeNode('sink')]
    const edges = [makeEdge('root', 'left'), makeEdge('root', 'right'), makeEdge('left', 'sink'), makeEdge('right', 'sink')]
    const result = applyFlowLayout(nodes, edges)
    const xRoot = result.find((n) => n.id === 'root')!.position.x
    const xSink = result.find((n) => n.id === 'sink')!.position.x
    expect(xRoot).toBeLessThan(xSink)
  })

  it('FLOW_LAYER_WIDTH and FLOW_NODE_SPACING are positive integers', () => {
    expect(FLOW_LAYER_WIDTH).toBeGreaterThan(0)
    expect(FLOW_NODE_SPACING).toBeGreaterThan(0)
  })
})
