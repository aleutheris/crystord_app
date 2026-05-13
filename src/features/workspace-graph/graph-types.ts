import { MarkerType } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import type { Atom } from '../../api-contract/graph-queries'

export function atomsToNodes(atoms: Atom[]): Node[] {
  const count = atoms.length
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)))
  const spacing = 220

  return atoms.map((atom, i) => ({
    id: atom.properties.shellies.uuid,
    type: 'atom',
    position: {
      x: (i % cols) * spacing,
      y: Math.floor(i / cols) * spacing,
    },
    data: {
      title: atom.properties.nuclearies.title,
      labels: atom.labels,
    },
  }))
}

export function atomsToEdges(atoms: Atom[]): Edge[] {
  const edges: Edge[] = []

  for (const atom of atoms) {
    const sourceId = atom.properties.shellies.uuid
    for (const bond of atom.bonds) {
      if (bond.direction === 'from') {
        edges.push({
          id: `${sourceId}-${bond.uuid}-${bond.name}`,
          source: sourceId,
          target: bond.uuid,
          label: bond.name,
        })
      }
    }
  }

  return edges
}

export function atomsToNetworkEdges(atoms: Atom[]): Edge[] {
  return atomsToEdges(atoms).map((e) => ({
    ...e,
    type: 'floating',
    label: undefined,
    markerEnd: { type: MarkerType.ArrowClosed },
  }))
}

export function mergeNodePositions(
  newNodes: Node[],
  prevNodes: Node[],
): Node[] {
  return newNodes.map((n) => {
    const existing = prevNodes.find((p) => p.id === n.id)
    return existing ? { ...n, position: existing.position } : n
  })
}
