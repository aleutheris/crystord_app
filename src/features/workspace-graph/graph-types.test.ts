import { describe, it, expect } from 'vitest'
import { atomsToNodes, atomsToEdges, atomsToNetworkEdges, mergeNodePositions } from './graph-types'
import type { Atom } from '../../api-contract/graph-queries'
import type { Node } from '@xyflow/react'

function makeAtom(uuid: string, title: string, labels: string[] = [], bonds: Atom['bonds'] = []): Atom {
  return {
    labels,
    bonds,
    properties: {
      shellies: { uuid },
      nuclearies: { title, description: '', content: '', operation: null, constants: null },
    },
  }
}

describe('atomsToNodes', () => {
  it('maps atoms to React Flow nodes with grid positions', () => {
    const atoms = [makeAtom('a1', 'Alpha', ['Tag']), makeAtom('a2', 'Beta')]
    const nodes = atomsToNodes(atoms)

    expect(nodes).toHaveLength(2)
    expect(nodes[0]).toMatchObject({ id: 'a1', type: 'atom', data: { title: 'Alpha', labels: ['Tag'] } })
    expect(nodes[1]).toMatchObject({ id: 'a2', type: 'atom', data: { title: 'Beta', labels: [] } })
    expect(nodes[0]!.position).toEqual({ x: 0, y: 0 })
    expect(nodes[1]!.position).toEqual({ x: 220, y: 0 })
  })

  it('returns empty array for no atoms', () => {
    expect(atomsToNodes([])).toEqual([])
  })
})

describe('atomsToEdges', () => {
  it('creates edges from bonds with direction "from"', () => {
    const atoms = [
      makeAtom('a1', 'Alpha', [], [{ uuid: 'a2', name: 'DEPENDS_ON', direction: 'from' }]),
      makeAtom('a2', 'Beta'),
    ]
    const edges = atomsToEdges(atoms)

    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({ source: 'a1', target: 'a2', label: 'DEPENDS_ON' })
  })

  it('ignores bonds with direction "to"', () => {
    const atoms = [
      makeAtom('a1', 'Alpha', [], [{ uuid: 'a2', name: 'REF', direction: 'to' }]),
    ]
    expect(atomsToEdges(atoms)).toHaveLength(0)
  })

  it('returns empty for atoms without bonds', () => {
    expect(atomsToEdges([makeAtom('a1', 'X')])).toHaveLength(0)
  })
})

describe('atomsToNetworkEdges', () => {
  it('creates floating-type edges with label stripped for Network view', () => {
    const atoms = [
      makeAtom('a1', 'Alpha', [], [{ uuid: 'a2', name: 'DEPENDS_ON', direction: 'from' }]),
      makeAtom('a2', 'Beta'),
    ]
    const edges = atomsToNetworkEdges(atoms)

    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({ type: 'floating', source: 'a1', target: 'a2' })
    expect(edges[0]!.label).toBeUndefined()
  })

  it('preserves bond name in atomsToEdges data seam (label extensibility)', () => {
    const atoms = [
      makeAtom('a1', 'Alpha', [], [{ uuid: 'a2', name: 'RELATES_TO', direction: 'from' }]),
      makeAtom('a2', 'Beta'),
    ]
    const raw = atomsToEdges(atoms)
    expect(raw[0]!.label).toBe('RELATES_TO')
  })
})

describe('mergeNodePositions', () => {
  it('preserves existing node positions for matching IDs', () => {
    const prev: Node[] = [
      { id: 'a1', type: 'atom', position: { x: 100, y: 200 }, data: { title: 'Old' } },
    ]
    const next: Node[] = [
      { id: 'a1', type: 'atom', position: { x: 0, y: 0 }, data: { title: 'New' } },
    ]
    const merged = mergeNodePositions(next, prev)

    expect(merged[0]!.position).toEqual({ x: 100, y: 200 })
    expect(merged[0]!.data.title).toBe('New')
  })

  it('uses computed position for new nodes', () => {
    const prev: Node[] = []
    const next: Node[] = [
      { id: 'a1', type: 'atom', position: { x: 50, y: 50 }, data: { title: 'First' } },
    ]
    const merged = mergeNodePositions(next, prev)

    expect(merged[0]!.position).toEqual({ x: 50, y: 50 })
  })
})
