import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { NetworkConnectionLine, CONNECTION_LINE_NODE_RADIUS } from './NetworkConnectionLine'
import { ConnectionLineType, Position } from '@xyflow/react'

vi.mock('@xyflow/react', () => ({
  ConnectionLineType: { Straight: 'straight' },
  Position: { Left: 'left' },
}))

function baseProps(overrides: Partial<Parameters<typeof NetworkConnectionLine>[0]> = {}): Parameters<typeof NetworkConnectionLine>[0] {
  return {
    fromX: 0,
    fromY: 0,
    toX: 200,
    toY: 0,
    toNode: null,
    fromNode: {} as never,
    fromHandle: {} as never,
    toHandle: null,
    fromPosition: Position.Left,
    toPosition: Position.Left,
    connectionLineType: ConnectionLineType.Straight,
    connectionStatus: null,
    pointer: { x: 200, y: 0 },
    ...overrides,
  }
}

function parseLineEnd(pathD: string): [number, number] {
  const parts = pathD.split(' L ')
  expect(parts[1]).toBeDefined()
  const coords = (parts[1] ?? '').split(',').map(Number)
  expect(coords[0]).toBeDefined()
  expect(coords[1]).toBeDefined()
  return [coords[0] ?? Number.NaN, coords[1] ?? Number.NaN]
}

describe('NetworkConnectionLine', () => {
  it('renders a path element', () => {
    const { container } = render(
      <svg>
        <NetworkConnectionLine {...baseProps()} />
      </svg>,
    )
    const path = container.querySelector('path')
    expect(path).not.toBeNull()
  })

  it('CONNECTION_LINE_NODE_RADIUS is 40 (half of NODE_SIZE 80)', () => {
    expect(CONNECTION_LINE_NODE_RADIUS).toBe(40)
  })

  it('when toNode is null, endpoint is the cursor position (toX, toY)', () => {
    const { container } = render(
      <svg>
        <NetworkConnectionLine {...baseProps({ fromX: 0, fromY: 0, toX: 150, toY: 75, toNode: null })} />
      </svg>,
    )
    const path = container.querySelector('path')!
    expect(path.getAttribute('d')).toBe('M 0,0 L 150,75')
  })

  it('when toNode is not null, endpoint snaps to target circle boundary (not node center) — horizontal approach', () => {
    // fromX=0, toX=200 → direction is right-to-left from target perspective
    // boundary point = (200 - 40, 0) = (160, 0)
    const { container } = render(
      <svg>
        <NetworkConnectionLine {...baseProps({ fromX: 0, fromY: 0, toX: 200, toY: 0, toNode: {} as never })} />
      </svg>,
    )
    const path = container.querySelector('path')!
    const d = path.getAttribute('d')!
    const [ex, ey] = parseLineEnd(d)
    expect(ex).toBeCloseTo(160, 5)
    expect(ey).toBeCloseTo(0, 5)
  })

  it('when toNode is not null, endpoint snaps to target circle boundary — vertical approach', () => {
    // fromX=0, fromY=0, toX=0, toY=200 → boundary = (0, 200-40) = (0, 160)
    const { container } = render(
      <svg>
        <NetworkConnectionLine {...baseProps({ fromX: 0, fromY: 0, toX: 0, toY: 200, toNode: {} as never })} />
      </svg>,
    )
    const path = container.querySelector('path')!
    const d = path.getAttribute('d')!
    const [ex, ey] = parseLineEnd(d)
    expect(ex).toBeCloseTo(0, 5)
    expect(ey).toBeCloseTo(160, 5)
  })

  it('when toNode is not null, endpoint snaps to boundary — diagonal approach', () => {
    // fromX=0, fromY=0, toX=100, toY=100 → dist=√(10000+10000)=100√2 ≈ 141.42
    // direction toward source: (-100/141.42, -100/141.42) = (-0.707, -0.707)
    // boundary = (100 - 40*0.707, 100 - 40*0.707) ≈ (71.72, 71.72) — wait, that's wrong
    // Actually: dx = fromX - toX = -100, dy = fromY - toY = -100 (direction source→from in target frame)
    // Wait: dx = fromX - toX = 0 - 100 = -100, dy = fromY - toY = 0 - 100 = -100
    // dist = sqrt(100^2 + 100^2) = 141.42
    // endX = toX + (dx/dist)*R = 100 + (-100/141.42)*40 = 100 - 28.28 = 71.72
    // endY = toY + (dy/dist)*R = 100 + (-100/141.42)*40 = 100 - 28.28 = 71.72
    const { container } = render(
      <svg>
        <NetworkConnectionLine {...baseProps({ fromX: 0, fromY: 0, toX: 100, toY: 100, toNode: {} as never })} />
      </svg>,
    )
    const path = container.querySelector('path')!
    const d = path.getAttribute('d')!
    const [ex, ey] = parseLineEnd(d)
    const expectedBoundary = 100 - (100 / Math.sqrt(20000)) * 40
    expect(ex).toBeCloseTo(expectedBoundary, 4)
    expect(ey).toBeCloseTo(expectedBoundary, 4)
  })

  it('boundary point lies exactly CONNECTION_LINE_NODE_RADIUS from target center when toNode is not null', () => {
    const { container } = render(
      <svg>
        <NetworkConnectionLine {...baseProps({ fromX: 50, fromY: 120, toX: 300, toY: 80, toNode: {} as never })} />
      </svg>,
    )
    const path = container.querySelector('path')!
    const d = path.getAttribute('d')!
    const [ex, ey] = parseLineEnd(d)
    const distFromCenter = Math.sqrt((ex - 300) ** 2 + (ey - 80) ** 2)
    expect(distFromCenter).toBeCloseTo(CONNECTION_LINE_NODE_RADIUS, 4)
  })

  it('when source and target centers coincide (degenerate), does not crash and endpoint stays at center', () => {
    const { container } = render(
      <svg>
        <NetworkConnectionLine {...baseProps({ fromX: 100, fromY: 100, toX: 100, toY: 100, toNode: {} as never })} />
      </svg>,
    )
    const path = container.querySelector('path')!
    // dist === 0 → no boundary adjustment → endpoint stays at center (100,100)
    expect(path.getAttribute('d')).toBe('M 100,100 L 100,100')
  })
})
