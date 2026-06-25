import { useState, useEffect, useCallback } from 'react'

export interface Backoff {
  /** True while the back-off window is open (callers disable the action). */
  active: boolean
  /** Whole seconds left in the current window. */
  remaining: number
  /** Open a back-off window of `seconds`. */
  trigger: (seconds: number) => void
}

/**
 * A simple per-second countdown used to throttle an action after a rate-limit (REQ-CR-260026).
 * `trigger(seconds)` opens the window; `active` stays true until it elapses.
 */
export function useBackoff(): Backoff {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [remaining])

  const trigger = useCallback((seconds: number) => setRemaining(seconds), [])

  return { active: remaining > 0, remaining, trigger }
}
