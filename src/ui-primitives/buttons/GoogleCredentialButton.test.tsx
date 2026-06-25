import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { GoogleCredentialButton } from './GoogleCredentialButton'

function mockGis() {
  let callback: ((r: { credential: string }) => void) | undefined
  const initialize = vi.fn((cfg: { callback: (r: { credential: string }) => void }) => { callback = cfg.callback })
  const renderButton = vi.fn()
  window.google = { accounts: { id: { initialize, renderButton } } }
  return { initialize, renderButton, fireCredential: (t: string) => callback?.({ credential: t }) }
}

function addGisScript() {
  const s = document.createElement('script')
  s.src = 'https://accounts.google.com/gsi/client'
  document.head.appendChild(s)
}

beforeEach(() => {
  delete window.google
  document.head.innerHTML = ''
})

afterEach(() => {
  delete window.google
  vi.restoreAllMocks()
})

describe('GoogleCredentialButton', () => {
  it('initializes GIS and yields the credential when the script is already present', () => {
    addGisScript()
    const gis = mockGis()
    const onCredential = vi.fn()

    render(<GoogleCredentialButton googleClientId="client-123" onCredential={onCredential} />)

    expect(gis.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client-123' }))
    // default render style is the full "standard" button
    expect(gis.renderButton).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'standard' }))
    gis.fireCredential('id-token-xyz')
    expect(onCredential).toHaveBeenCalledWith('id-token-xyz')
  })

  it('renders the requested button type (icon)', () => {
    addGisScript()
    const gis = mockGis()
    render(<GoogleCredentialButton googleClientId="c" onCredential={vi.fn()} buttonType="icon" />)
    expect(gis.renderButton).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'icon' }))
  })

  it('loads the GIS script when absent, then initializes on load', () => {
    const gis = mockGis()
    render(<GoogleCredentialButton googleClientId="client-123" onCredential={vi.fn()} />)

    const script = document.head.querySelector('script[src*="accounts.google.com/gsi"]') as HTMLScriptElement
    expect(script).toBeTruthy()
    expect(gis.initialize).not.toHaveBeenCalled()

    script.onload?.(new Event('load'))
    expect(gis.initialize).toHaveBeenCalled()
  })

  it('no-ops when the GIS SDK is unavailable', () => {
    addGisScript() // present, but window.google is undefined
    const onCredential = vi.fn()
    expect(() => render(<GoogleCredentialButton googleClientId="client-123" onCredential={onCredential} />)).not.toThrow()
    expect(onCredential).not.toHaveBeenCalled()
  })

  it('calls the latest onCredential without re-initializing GIS on re-render', () => {
    addGisScript()
    const gis = mockGis()
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<GoogleCredentialButton googleClientId="c" onCredential={first} />)
    rerender(<GoogleCredentialButton googleClientId="c" onCredential={second} />)
    // still only one initialize (stable deps), but the newest callback is used
    expect(gis.initialize).toHaveBeenCalledOnce()
    gis.fireCredential('tok')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('tok')
  })
})
