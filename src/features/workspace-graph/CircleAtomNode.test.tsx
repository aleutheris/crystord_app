import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CircleAtomNode, RING_THICKNESS, CLICK_DRAG_THRESHOLD } from './CircleAtomNode'
import { RING_COLOR, SELECTION_BORDER_COLOR } from './network-tokens'

vi.mock('@xyflow/react', () => ({
  Handle: ({ id, type, 'data-testid': testid, style }: {
    id?: string
    type: string
    position: string
    'data-testid'?: string
    style?: React.CSSProperties
  }) => (
    <div
      data-testid={testid ?? `handle-${type}-${id ?? 'default'}`}
      data-handle-type={type}
      data-handle-id={id}
      style={style}
    />
  ),
  Position: { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' },
}))

function makeProps(title: string, selected = false) {
  return {
    id: 'test-node',
    data: { title, labels: [] },
    selected,
    dragging: false,
    draggable: true,
    selectable: true,
    deletable: true,
    zIndex: 0,
    isConnectable: true,
    type: 'circleAtom',
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  }
}

describe('CircleAtomNode', () => {
  it('renders the atom title', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('renders the node body as a circle (border-radius 50%)', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    const body = screen.getByTestId('circle-node-body') as HTMLElement
    expect(body.style.borderRadius).toBe('50%')
  })

  it('applies selected border when selected', () => {
    render(<CircleAtomNode {...makeProps('Alpha', true)} />)
    const body = screen.getByTestId('circle-node-body') as HTMLElement
    expect(body.style.borderStyle).toBe('solid')
    expect(body.style.borderWidth).not.toBe('0px')
  })

  it('has invisible target handles on all four sides for nearest-boundary anchoring', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    const sides = ['top', 'right', 'bottom', 'left']
    for (const side of sides) {
      const handle = screen.getByTestId(`handle-target-${side}`)
      expect(handle).toHaveAttribute('data-handle-type', 'target')
      expect(handle).toHaveStyle({ opacity: 0 })
    }
  })

  it('does not render a connector dot (previous side-handle affordance removed)', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    expect(screen.queryByTestId('connector-handle')).not.toBeInTheDocument()
  })

  it('renders a ring source handle', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    const ring = screen.getByTestId('ring-handle')
    expect(ring).toBeInTheDocument()
    expect(ring).toHaveAttribute('data-handle-type', 'source')
    expect(ring).toHaveAttribute('data-handle-id', 'ring')
  })

  it('ring is hidden by default (opacity 0, pointerEvents none)', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    const ring = screen.getByTestId('ring-handle') as HTMLElement
    expect(ring.style.opacity).toBe('0')
    expect(ring.style.pointerEvents).toBe('none')
  })

  it('ring is visible when the node is selected (opacity 1)', () => {
    render(<CircleAtomNode {...makeProps('Alpha', true)} />)
    const ring = screen.getByTestId('ring-handle') as HTMLElement
    expect(ring.style.opacity).toBe('1')
    expect(ring.style.pointerEvents).toBe('all')
  })

  it('ring uses the RING_COLOR token (Control Green — connection-initiation affordance)', () => {
    render(<CircleAtomNode {...makeProps('Alpha', true)} />)
    const ring = screen.getByTestId('ring-handle') as HTMLElement
    // jsdom normalises hex to rgb; RING_COLOR (#00A676) → rgb(0, 166, 118)
    expect(ring.style.borderColor).not.toBe('')
    expect(ring.style.borderColor).not.toBe(SELECTION_BORDER_COLOR)
  })

  it('ring color (RING_COLOR) and selection border color (SELECTION_BORDER_COLOR) are distinct', () => {
    expect(RING_COLOR).not.toBe(SELECTION_BORDER_COLOR)
  })

  it('ring is circular (border-radius 50%)', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    const ring = screen.getByTestId('ring-handle') as HTMLElement
    expect(ring.style.borderRadius).toBe('50%')
  })

  it('inner node body uses grab cursor for drag affordance', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    const body = screen.getByTestId('circle-node-body') as HTMLElement
    expect(body.style.cursor).toBe('grab')
  })

  it('RING_THICKNESS is 8px (acceptable range 6–10px per D1 / ADR-260036)', () => {
    expect(RING_THICKNESS).toBe(8)
  })

  it('CLICK_DRAG_THRESHOLD is 4px (minimum pointer movement to distinguish click from drag)', () => {
    expect(CLICK_DRAG_THRESHOLD).toBe(4)
  })
})
