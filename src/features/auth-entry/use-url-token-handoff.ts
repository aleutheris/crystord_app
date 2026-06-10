import { useEffect, useRef } from 'react'

export function useUrlTokenHandoff(signIn: (token: string) => void): void {
  const signInRef = useRef(signIn)
  signInRef.current = signIn

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (!urlToken) return

    signInRef.current(urlToken)

    params.delete('token')
    const remaining = params.toString()
    const newUrl =
      window.location.pathname +
      (remaining ? `?${remaining}` : '') +
      window.location.hash
    window.history.replaceState(null, '', newUrl)
  }, []) // intentionally empty — runs once on mount regardless of signIn reference stability
}
