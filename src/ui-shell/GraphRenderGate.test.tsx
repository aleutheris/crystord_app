import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphRenderGate } from './GraphRenderGate'

describe('GraphRenderGate', () => {
  it('renders children in full mode', () => {
    render(
      <GraphRenderGate atomCount={50} mode="full" onConfirm={vi.fn()}>
        <div data-testid="canvas" />
      </GraphRenderGate>
    )
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('renders children in reduced mode', () => {
    render(
      <GraphRenderGate atomCount={200} mode="reduced" onConfirm={vi.fn()}>
        <div data-testid="canvas" />
      </GraphRenderGate>
    )
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('shows a warning and hides children in blocked mode', () => {
    render(
      <GraphRenderGate atomCount={450} mode="blocked" onConfirm={vi.fn()}>
        <div data-testid="canvas" />
      </GraphRenderGate>
    )
    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument()
    expect(screen.getByText(/450 nodes/)).toBeInTheDocument()
  })

  it('shows a "Render anyway" button in blocked mode', () => {
    render(
      <GraphRenderGate atomCount={450} mode="blocked" onConfirm={vi.fn()}>
        <div />
      </GraphRenderGate>
    )
    expect(screen.getByRole('button', { name: 'Render anyway' })).toBeInTheDocument()
  })

  it('calls onConfirm when "Render anyway" is clicked', async () => {
    const onConfirm = vi.fn()
    render(
      <GraphRenderGate atomCount={450} mode="blocked" onConfirm={onConfirm}>
        <div />
      </GraphRenderGate>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Render anyway' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('displays the node count in the blocked warning', () => {
    render(
      <GraphRenderGate atomCount={512} mode="blocked" onConfirm={vi.fn()}>
        <div />
      </GraphRenderGate>
    )
    expect(screen.getByText(/512 nodes/)).toBeInTheDocument()
  })
})
