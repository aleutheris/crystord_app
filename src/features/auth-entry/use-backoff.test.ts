import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBackoff } from './use-backoff'

describe('useBackoff', () => {
  it('is inactive initially', () => {
    const { result } = renderHook(() => useBackoff())
    expect(result.current.active).toBe(false)
    expect(result.current.remaining).toBe(0)
  })

  it('counts down each second and clears when the window elapses', () => {
    vi.useFakeTimers()
    try {
      const { result } = renderHook(() => useBackoff())
      act(() => result.current.trigger(3))
      expect(result.current.active).toBe(true)
      expect(result.current.remaining).toBe(3)

      act(() => { vi.advanceTimersByTime(1000) })
      expect(result.current.remaining).toBe(2)

      act(() => { vi.advanceTimersByTime(3000) })
      expect(result.current.active).toBe(false)
      expect(result.current.remaining).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
