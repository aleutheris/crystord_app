import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AdminPlaceholder } from './AdminPlaceholder'

describe('AdminPlaceholder', () => {
  it('renders placeholder messaging without admin functionality', () => {
    render(
      <MemoryRouter>
        <AdminPlaceholder />
      </MemoryRouter>,
    )

    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('This area is planned for a future release.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to workspace/i })).toHaveAttribute('href', '/')
  })

  it('does not expose any admin action controls', () => {
    render(
      <MemoryRouter>
        <AdminPlaceholder />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })
})
