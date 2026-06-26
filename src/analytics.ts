const GA_MEASUREMENT_ID = 'G-LLSNMGWLH4'

/**
 * Load Google Analytics (gtag.js) — production builds only. In development the GA `collect` endpoint
 * is pointless noise (blocked by tracker-blocking browsers, and it pollutes the real GA property with
 * localhost traffic), so we skip loading it entirely. This mirrors the snippet that previously lived
 * inline in index.html, gated behind `import.meta.env.PROD`.
 */
export function initAnalytics(): void {
  if (!import.meta.env.PROD) return

  const w = window as typeof window & { dataLayer: unknown[] }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  w.dataLayer = w.dataLayer || []
  function gtag(...args: unknown[]): void {
    w.dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}
