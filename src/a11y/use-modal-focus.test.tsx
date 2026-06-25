import { describe, it, expect, vi } from 'vitest'
import { useRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useModalFocus } from './use-modal-focus'

function Dialog({ onClose, withFocusables = true }: { onClose: () => void; withFocusables?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useModalFocus(ref, onClose)
  return (
    <div ref={ref} tabIndex={-1} data-testid="dialog">
      {withFocusables && (
        <>
          <button>first</button>
          <button>middle</button>
          <button>last</button>
        </>
      )}
    </div>
  )
}

/** Host that mounts a trigger and toggles the dialog, to exercise focus-restore-on-close. */
function Harness({ onClose, open }: { onClose: () => void; open: boolean }) {
  return (
    <>
      <button data-testid="trigger">trigger</button>
      {open && <Dialog onClose={onClose} />}
    </>
  )
}

/** Host whose ref is never attached — exercises the null-container guard. */
function DetachedDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useModalFocus(ref, onClose)
  return <div data-testid="detached" />
}

describe('useModalFocus', () => {
  it('moves focus to the first focusable element on open', () => {
    render(<Dialog onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
  })

  it('focuses the container itself when there are no focusable children', () => {
    render(<Dialog onClose={vi.fn()} withFocusables={false} />)
    expect(screen.getByTestId('dialog')).toHaveFocus()
  })

  it('closes on Escape and stops the event from propagating', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const outerKeyDown = vi.fn()
    render(
      <div onKeyDown={outerKeyDown}>
        <Dialog onClose={onClose} />
      </div>,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    expect(outerKeyDown).not.toHaveBeenCalled()
  })

  it('wraps Tab from the last element back to the first', async () => {
    const user = userEvent.setup()
    render(<Dialog onClose={vi.fn()} />)
    screen.getByRole('button', { name: 'last' }).focus()
    await user.keyboard('{Tab}')
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
  })

  it('wraps Shift+Tab from the first element back to the last', async () => {
    const user = userEvent.setup()
    render(<Dialog onClose={vi.fn()} />)
    screen.getByRole('button', { name: 'first' }).focus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus()
  })

  it('does not intercept Tab from a middle element — focus advances normally', async () => {
    const user = userEvent.setup()
    render(<Dialog onClose={vi.fn()} />)
    screen.getByRole('button', { name: 'middle' }).focus()
    await user.keyboard('{Tab}')
    // the trap only wraps at the ends; from the middle it lets focus advance to the next control
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus()
  })

  it('preventDefault-traps Tab when the dialog has no focusable children', async () => {
    const user = userEvent.setup()
    render(<Dialog onClose={vi.fn()} withFocusables={false} />)
    // focus is on the container; Tab must not escape
    await user.keyboard('{Tab}')
    expect(screen.getByTestId('dialog')).toHaveFocus()
  })

  it('ignores other keys', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Dialog onClose={onClose} />)
    await user.keyboard('a')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
  })

  it('restores focus to the trigger on close', async () => {
    const onClose = vi.fn()
    const { rerender } = render(<Harness onClose={onClose} open={false} />)
    const trigger = screen.getByTestId('trigger')
    trigger.focus()
    expect(trigger).toHaveFocus()

    rerender(<Harness onClose={onClose} open={true} />)
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()

    rerender(<Harness onClose={onClose} open={false} />)
    expect(trigger).toHaveFocus()
  })

  it('uses the latest onClose without re-running the trap', async () => {
    const user = userEvent.setup()
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Dialog onClose={first} />)
    rerender(<Dialog onClose={second} />)
    await user.keyboard('{Escape}')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })

  it('no-ops safely when the container ref is never attached', () => {
    expect(() => render(<DetachedDialog onClose={vi.fn()} />)).not.toThrow()
  })
})
