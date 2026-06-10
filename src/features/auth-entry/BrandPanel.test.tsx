import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandPanel } from './BrandPanel'

describe('BrandPanel', () => {
  it('renders the brand tagline', () => {
    render(<BrandPanel />)
    expect(screen.getByRole('heading', { name: /your data, your control/i })).toBeInTheDocument()
  })

  it('renders the brand subtitle', () => {
    render(<BrandPanel />)
    expect(screen.getByText(/build and explore knowledge graphs/i)).toBeInTheDocument()
  })

  it('renders the Crystord logo', () => {
    render(<BrandPanel />)
    expect(screen.getByRole('img', { name: /crystord/i })).toBeInTheDocument()
  })

  it('renders all four feature items', () => {
    render(<BrandPanel />)
    expect(screen.getByText('Interactive Graph Workspace')).toBeInTheDocument()
    expect(screen.getByText('Atom and Bond Management')).toBeInTheDocument()
    expect(screen.getByText('Search and Discovery')).toBeInTheDocument()
    expect(screen.getByText('Real-time Data View')).toBeInTheDocument()
  })

  it('renders feature items in a list', () => {
    render(<BrandPanel />)
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBe(4)
  })
})
