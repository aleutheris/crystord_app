import { useEffect, useRef } from 'react'

interface GoogleCredentialButtonProps {
  googleClientId: string
  /** Receives the Google Identity Services ID token (credential) when the user authenticates. */
  onCredential: (credential: string) => void
  /** GIS render style — `icon` for the compact sign-in glyph, `standard` for the full button. */
  buttonType?: 'standard' | 'icon'
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; locale?: string; callback: (resp: { credential: string }) => void }) => void
          renderButton: (element: HTMLElement, options: { theme: string; size: string; type?: string }) => void
        }
      }
    }
  }
}

/**
 * The shared Google Identity Services (GIS) credential button (BI-260065 / ADR-260051): loads the GIS
 * script if needed, renders the Google button, and yields the resulting ID token via `onCredential`.
 * Consumers decide what to do with the token (sign in vs. link). A latest-ref keeps `onCredential`
 * current without re-initializing GIS on every parent re-render.
 */
export function GoogleCredentialButton({ googleClientId, onCredential, buttonType = 'standard' }: GoogleCredentialButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onCredentialRef = useRef(onCredential)
  useEffect(() => { onCredentialRef.current = onCredential })

  useEffect(() => {
    function initGIS() {
      if (!window.google || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        locale: 'en',
        callback: (response) => onCredentialRef.current(response.credential),
      })
      window.google.accounts.id.renderButton(containerRef.current, { theme: 'outline', size: 'large', type: buttonType })
    }

    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]')
    if (existing) {
      initGIS()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = initGIS
    document.head.appendChild(script)
  }, [googleClientId, buttonType])

  return <div ref={containerRef} />
}
