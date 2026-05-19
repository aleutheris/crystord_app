import { describe, it, expect } from 'vitest'
import { FLOW_ELIGIBLE_BONDS, projectFlowAtoms } from './flow-projection'
import type { Atom } from '../../api-contract/graph-queries'

function makeAtom(uuid: string, bonds: Atom['bonds'] = []): Atom {
  return {
    labels: [],
    bonds,
    properties: {
      shellies: { uuid },
      nuclearies: { title: uuid, description: '', content: '', operation: null, constants: null },
    },
  }
}

describe('FLOW_ELIGIBLE_BONDS', () => {
  it('includes OP_DEPENDENCY as the baseline eligible bond', () => {
    expect(FLOW_ELIGIBLE_BONDS).toContain('OP_DEPENDENCY')
  })

  it('is a non-empty readonly array (extension seam)', () => {
    expect(FLOW_ELIGIBLE_BONDS.length).toBeGreaterThan(0)
  })
})

describe('projectFlowAtoms', () => {
  const eligibleSet = new Set(['OP_DEPENDENCY'])

  it('returns empty array when no atoms have eligible bonds', () => {
    const atoms = [
      makeAtom('a1', [{ uuid: 'a2', name: 'OTHER_BOND', direction: 'from' }]),
      makeAtom('a2'),
    ]
    expect(projectFlowAtoms(atoms, eligibleSet)).toHaveLength(0)
  })

  it('includes source atom with eligible outgoing bond', () => {
    const atoms = [
      makeAtom('a1', [{ uuid: 'a2', name: 'OP_DEPENDENCY', direction: 'from' }]),
      makeAtom('a2'),
    ]
    const result = projectFlowAtoms(atoms, eligibleSet)
    expect(result.map((a) => a.properties.shellies.uuid)).toContain('a1')
  })

  it('includes target atom of an eligible bond', () => {
    const atoms = [
      makeAtom('a1', [{ uuid: 'a2', name: 'OP_DEPENDENCY', direction: 'from' }]),
      makeAtom('a2'),
    ]
    const result = projectFlowAtoms(atoms, eligibleSet)
    expect(result.map((a) => a.properties.shellies.uuid)).toContain('a2')
  })

  it('excludes atoms not participating in any eligible bond', () => {
    const atoms = [
      makeAtom('a1', [{ uuid: 'a2', name: 'OP_DEPENDENCY', direction: 'from' }]),
      makeAtom('a2'),
      makeAtom('isolated'),
    ]
    const result = projectFlowAtoms(atoms, eligibleSet)
    expect(result.map((a) => a.properties.shellies.uuid)).not.toContain('isolated')
  })

  it('ignores bonds with direction "to" for projection', () => {
    const atoms = [
      makeAtom('a1', [{ uuid: 'a2', name: 'OP_DEPENDENCY', direction: 'to' }]),
      makeAtom('a2'),
    ]
    expect(projectFlowAtoms(atoms, eligibleSet)).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(projectFlowAtoms([], eligibleSet)).toHaveLength(0)
  })

  it('includes only participating atoms when mixed bond types are present', () => {
    const atoms = [
      makeAtom('a1', [
        { uuid: 'a2', name: 'OP_DEPENDENCY', direction: 'from' },
        { uuid: 'a3', name: 'OTHER', direction: 'from' },
      ]),
      makeAtom('a2'),
      makeAtom('a3'),
      makeAtom('unrelated'),
    ]
    const result = projectFlowAtoms(atoms, eligibleSet)
    const ids = result.map((a) => a.properties.shellies.uuid)
    expect(ids).toContain('a1')
    expect(ids).toContain('a2')
    expect(ids).not.toContain('a3')
    expect(ids).not.toContain('unrelated')
  })
})
