import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LabeledField } from './LabeledField'

describe('LabeledField', () => {
  it('renders a labelled input wired by id and reports changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LabeledField id="f" label="Name" value="" onChange={onChange} />)
    const input = screen.getByLabelText('Name')
    expect(input).toHaveAttribute('id', 'f')
    expect(input).toHaveAttribute('type', 'text') // default
    expect(input).toBeRequired() // default
    await user.type(input, 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('honours type, autoComplete, inputMode, and required overrides', () => {
    render(
      <LabeledField
        id="p" label="Password" value="x" onChange={vi.fn()}
        type="password" autoComplete="new-password" inputMode="numeric" required={false}
      />,
    )
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('autocomplete', 'new-password')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).not.toBeRequired()
  })

  it('wires the inline error to the input and renders it', () => {
    render(<LabeledField id="e" label="Email" value="" onChange={vi.fn()} error="Bad email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'e-error')
    const err = screen.getByText('Bad email')
    expect(err).toHaveAttribute('id', 'e-error')
  })

  it('omits error wiring when there is no error', () => {
    render(<LabeledField id="ok" label="Email" value="" onChange={vi.fn()} />)
    const input = screen.getByLabelText('Email')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('wraps in a field container when a field class is provided', () => {
    const { container } = render(
      <LabeledField id="w" label="L" value="" onChange={vi.fn()} classNames={{ field: 'wrap', label: 'lbl', input: 'inp', error: 'err' }} error="e" />,
    )
    expect(container.querySelector('.wrap')).toBeInTheDocument()
    expect(screen.getByLabelText('L')).toHaveClass('inp')
    expect(screen.getByText('e')).toHaveClass('err')
  })

  it('renders without a wrapper when no field class is given', () => {
    const { container } = render(<LabeledField id="nw" label="L" value="" onChange={vi.fn()} classNames={{ label: 'lbl' }} />)
    // label is a direct child (no wrapping div with a class)
    expect(container.querySelector('div[class]')).toBeNull()
  })
})
