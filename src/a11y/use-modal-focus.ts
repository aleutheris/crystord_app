import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

/**
 * Modal focus management for an open overlay dialog (BI-260064 / REQ-QR-260002). While the host is
 * mounted it:
 *  - moves focus into the dialog (first focusable element, else the container itself),
 *  - traps Tab / Shift+Tab so focus cycles within the dialog,
 *  - routes Escape to `onClose`, scoped to the dialog (`stopPropagation`) so it does not also reach
 *    handlers behind it (e.g. the canvas Escape),
 *  - on unmount, restores focus to the element that was focused when the dialog opened (the trigger).
 *
 * Mount the host component only while the dialog is open so this lifecycle maps to open → close. The
 * container should be programmatically focusable (`tabIndex={-1}`) for the no-focusable-children case.
 */
export function useModalFocus(
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  // latest-ref so a changing onClose doesn't re-run (and tear down) the trap effect
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const trigger = document.activeElement as HTMLElement | null
    const initial = focusableWithin(container)
    ;(initial[0] ?? container).focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusableWithin(container!)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      trigger?.focus?.()
    }
  }, [containerRef])
}
