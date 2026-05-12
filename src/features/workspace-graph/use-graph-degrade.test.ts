import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGraphDegrade, REDUCED_THRESHOLD, BLOCKED_THRESHOLD } from './use-graph-degrade'

describe('useGraphDegrade', () => {
  it('returns full mode for counts within the full threshold', () => {
    const { result } = renderHook(() => useGraphDegrade(0))
    expect(result.current.mode).toBe('full')
  })

  it('returns full mode at exactly the reduced threshold', () => {
    const { result } = renderHook(() => useGraphDegrade(REDUCED_THRESHOLD))
    expect(result.current.mode).toBe('full')
  })

  it('returns reduced mode when count exceeds the reduced threshold', () => {
    const { result } = renderHook(() => useGraphDegrade(REDUCED_THRESHOLD + 1))
    expect(result.current.mode).toBe('reduced')
  })

  it('returns reduced mode at exactly the blocked threshold', () => {
    const { result } = renderHook(() => useGraphDegrade(BLOCKED_THRESHOLD))
    expect(result.current.mode).toBe('reduced')
  })

  it('returns blocked mode when count exceeds the blocked threshold', () => {
    const { result } = renderHook(() => useGraphDegrade(BLOCKED_THRESHOLD + 1))
    expect(result.current.mode).toBe('blocked')
  })

  it('switches to reduced mode after user confirms a blocked render', () => {
    const { result } = renderHook(() => useGraphDegrade(BLOCKED_THRESHOLD + 1))
    expect(result.current.mode).toBe('blocked')

    act(() => result.current.confirmRender())

    expect(result.current.mode).toBe('reduced')
  })

  it('invalidates confirmation when the atom count changes', () => {
    const { rerender, result } = renderHook(({ count }) => useGraphDegrade(count), {
      initialProps: { count: BLOCKED_THRESHOLD + 1 },
    })

    act(() => result.current.confirmRender())
    expect(result.current.mode).toBe('reduced')

    // A new search returns a different count — confirmation no longer applies
    rerender({ count: BLOCKED_THRESHOLD + 2 })
    expect(result.current.mode).toBe('blocked')
  })
})
