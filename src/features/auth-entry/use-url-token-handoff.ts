import { useEffect } from 'react'

export function useUrlTokenHandoff(signIn: (token: string) => void): void {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (!urlToken) return

    signIn(urlToken)

    params.delete('token')
    const remaining = params.toString()
    const newUrl =
      window.location.pathname +
      (remaining ? `?${remaining}` : '') +
      window.location.hash
    window.history.replaceState(null, '', newUrl)
  }, [signIn])
}
