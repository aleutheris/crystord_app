import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphViewTabs } from './GraphViewTabs'

describe('GraphViewTabs', () => {
  it('renders both Network and Flow tabs', () => {
    render(<GraphViewTabs activeView="network" onViewChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Network' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Flow' })).toBeInTheDocument()
  })

  it('marks Network tab as selected when Network is active', () => {
    render(<GraphViewTabs activeView="network" onViewChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Network' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Flow' })).toHaveAttribute('aria-selected', 'false')
  })

  it('marks Flow tab as selected when Flow is active', () => {
    render(<GraphViewTabs activeView="flow" onViewChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Flow' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Network' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onViewChange with "flow" when Flow tab is clicked', async () => {
    const onViewChange = vi.fn()
    render(<GraphViewTabs activeView="network" onViewChange={onViewChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Flow' }))
    expect(onViewChange).toHaveBeenCalledWith('flow')
  })

  it('calls onViewChange with "network" when Network tab is clicked', async () => {
    const onViewChange = vi.fn()
    render(<GraphViewTabs activeView="flow" onViewChange={onViewChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Network' }))
    expect(onViewChange).toHaveBeenCalledWith('network')
  })

  it('tabs are rendered inside a tablist container', () => {
    render(<GraphViewTabs activeView="network" onViewChange={vi.fn()} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })
})
