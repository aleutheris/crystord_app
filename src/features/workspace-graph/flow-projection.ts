import type { Atom } from '../../api-contract/graph-queries'

// Frontend-managed eligible-bond allowlist (D1 / REQ-FR-260044).
// Extension seam: add bond names here to include them in the Flow view projection.
export const FLOW_ELIGIBLE_BONDS: readonly string[] = ['OP_DEPENDENCY']

// Returns only atoms that participate in at least one eligible flow bond.
// Includes both source atoms (with outgoing eligible bonds) and their target atoms.
export function projectFlowAtoms(atoms: Atom[], eligibleBonds: ReadonlySet<string>): Atom[] {
  const participatingIds = new Set<string>()

  for (const atom of atoms) {
    const sourceId = atom.properties.shellies.uuid
    for (const bond of atom.bonds) {
      if (bond.direction === 'from' && eligibleBonds.has(bond.name)) {
        participatingIds.add(sourceId)
        participatingIds.add(bond.uuid)
      }
    }
  }

  return atoms.filter((a) => participatingIds.has(a.properties.shellies.uuid))
}
