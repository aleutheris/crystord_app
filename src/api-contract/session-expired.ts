/* Lightweight pub/sub channel for 401 session expiry across the Apollo link boundary */

let sessionExpiredCallback: (() => void) | null = null

export function onSessionExpired(cb: () => void): void {
  sessionExpiredCallback = cb
}

export function triggerSessionExpired(): void {
  sessionExpiredCallback?.()
}
