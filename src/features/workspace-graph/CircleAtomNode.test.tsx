import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CircleAtomNode } from './CircleAtomNode'

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

  it('applies selected border color when selected', () => {
    render(<CircleAtomNode {...makeProps('Alpha', true)} />)
    const body = screen.getByTestId('circle-node-body')
    expect(body).toHaveStyle({ border: '2px solid #0066CC' })
  })

  it('exposes a visible connector handle on the source side', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    const connector = screen.getByTestId('connector-handle')
    expect(connector).toBeInTheDocument()
    expect(connector).toHaveAttribute('data-handle-type', 'source')
    expect(connector).toHaveAttribute('data-handle-id', 'connector')
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

  it('connector handle is visually distinct (Trust Blue background)', () => {
    render(<CircleAtomNode {...makeProps('Alpha')} />)
    const connector = screen.getByTestId('connector-handle')
    expect(connector).toHaveStyle({ background: '#0066CC' })
  })
})
