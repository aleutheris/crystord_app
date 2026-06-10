import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUrlTokenHandoff } from './use-url-token-handoff'

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search, pathname: '/', hash: '' },
    writable: true,
    configurable: true,
  })
}

describe('useUrlTokenHandoff', () => {
  let replaceState: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
    setSearch('')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    setSearch('')
  })

  it('does nothing when no token param is present', () => {
    const signIn = vi.fn()
    setSearch('')
    renderHook(() => useUrlTokenHandoff(signIn))
    expect(signIn).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('calls signIn with the token from the URL', () => {
    const signIn = vi.fn()
    setSearch('?token=platform-jwt')
    renderHook(() => useUrlTokenHandoff(signIn))
    expect(signIn).toHaveBeenCalledWith('platform-jwt')
  })

  it('strips the token param from the URL via history.replaceState', () => {
    const signIn = vi.fn()
    setSearch('?token=platform-jwt')
    renderHook(() => useUrlTokenHandoff(signIn))
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
  })

  it('preserves other query params when stripping token', () => {
    const signIn = vi.fn()
    setSearch('?token=platform-jwt&view=network')
    renderHook(() => useUrlTokenHandoff(signIn))
    expect(replaceState).toHaveBeenCalledWith(null, '', '/?view=network')
  })

  it('preserves hash when stripping token', () => {
    const signIn = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?token=platform-jwt', pathname: '/', hash: '#section' },
      writable: true,
      configurable: true,
    })
    renderHook(() => useUrlTokenHandoff(signIn))
    expect(replaceState).toHaveBeenCalledWith(null, '', '/#section')
  })

  it('calls signIn exactly once on mount', () => {
    const signIn = vi.fn()
    setSearch('?token=abc')
    const { rerender } = renderHook(() => useUrlTokenHandoff(signIn))
    rerender()
    expect(signIn).toHaveBeenCalledTimes(1)
  })
})
