import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminPlaceholder } from './AdminPlaceholder'

describe('AdminPlaceholder', () => {
  it('renders placeholder messaging without admin functionality', () => {
    render(<AdminPlaceholder />)

    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('This area is planned for a future release.')).toBeInTheDocument()
  })

  it('does not expose any admin action controls', () => {
    render(<AdminPlaceholder />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
