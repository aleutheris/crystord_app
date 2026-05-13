import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { FloatingEdge } from './FloatingEdge'
import type { EdgeProps } from '@xyflow/react'

vi.mock('@xyflow/react', () => ({
  useInternalNode: vi.fn(),
  BaseEdge: ({ id, path }: { id: string; path: string }) => (
    <path data-testid={`edge-${id}`} d={path} />
  ),
}))

import { useInternalNode } from '@xyflow/react'

function makeNode(x: number, y: number, size = 80) {
  return {
    id: 'n',
    type: 'circleAtom',
    position: { x, y },
    data: {},
    measured: { width: size, height: size },
    internals: { positionAbsolute: { x, y }, z: 0 },
  }
}

function makeProps(): EdgeProps {
  return {
    id: 'test-edge',
    source: 'node-1',
    target: 'node-2',
    sourceX: 0,
    sourceY: 0,
    targetX: 200,
    targetY: 0,
    sourcePosition: 'right' as EdgeProps['sourcePosition'],
    targetPosition: 'left' as EdgeProps['targetPosition'],
  }
}

describe('FloatingEdge', () => {
  it('renders nothing when source node is not found', () => {
    vi.mocked(useInternalNode)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(makeNode(200, 0) as ReturnType<typeof useInternalNode>)
    const { container } = render(<FloatingEdge {...makeProps()} />)
    expect(container.querySelector('path')).toBeNull()
  })

  it('renders nothing when target node is not found', () => {
    vi.mocked(useInternalNode)
      .mockReturnValueOnce(makeNode(0, 0) as ReturnType<typeof useInternalNode>)
      .mockReturnValueOnce(undefined)
    const { container } = render(<FloatingEdge {...makeProps()} />)
    expect(container.querySelector('path')).toBeNull()
  })

  it('renders a BaseEdge path when both nodes are present', () => {
    vi.mocked(useInternalNode)
      .mockReturnValueOnce(makeNode(0, 0) as ReturnType<typeof useInternalNode>)
      .mockReturnValueOnce(makeNode(200, 0) as ReturnType<typeof useInternalNode>)
    const { getByTestId } = render(<FloatingEdge {...makeProps()} />)
    expect(getByTestId('edge-test-edge')).toBeInTheDocument()
  })
})
