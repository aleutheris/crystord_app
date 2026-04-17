import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuerySummary } from './QuerySummary'

describe('QuerySummary', () => {
  it('renders nothing when summary is empty', () => {
    const { container } = render(<QuerySummary summary="" resultCount={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays summary text and result count', () => {
    render(<QuerySummary summary='Search: "proj"' resultCount={3} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Search: "proj"')).toBeInTheDocument()
    expect(screen.getByText('3 results')).toBeInTheDocument()
  })

  it('uses singular for one result', () => {
    render(<QuerySummary summary="Labels: Task" resultCount={1} />)
    expect(screen.getByText('1 result')).toBeInTheDocument()
  })
})
