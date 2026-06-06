import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => undefined,
})

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

const STORAGE_KEY = 'crystord-theme'

function readStored(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage unavailable
  }
  return 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStored)

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'light') {
      root.setAttribute('data-theme', 'light')
    } else if (mode === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // localStorage unavailable
    }
  }, [mode])

  function setMode(next: ThemeMode) {
    setModeState(next)
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
