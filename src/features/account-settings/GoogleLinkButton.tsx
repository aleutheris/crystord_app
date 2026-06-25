import { useEffect, useRef } from 'react'

interface GoogleLinkButtonProps {
  googleClientId: string
  /** Receives the GIS ID token to link to the signed-in account (BI-260059). */
  onCredential: (idToken: string) => void
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
 * Renders the Google Identity Services button for *linking* Google to the current account and yields
 * the resulting ID token via `onCredential`. Mirrors the GIS dance in auth-entry's GoogleSignInButton;
 * it lives here (not shared) because feature modules may not import each other's internals.
 */
export function GoogleLinkButton({ googleClientId, onCredential }: GoogleLinkButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Latest-ref: keep the callback current without making it an effect dependency, so the GIS button
  // is not re-initialized on every parent re-render (e.g. each keystroke in the password field).
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
      window.google.accounts.id.renderButton(containerRef.current, { theme: 'outline', size: 'large', type: 'standard' })
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
  }, [googleClientId])

  return <div ref={containerRef} />
}
