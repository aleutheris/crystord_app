import { useState } from 'react'

export type RenderMode = 'full' | 'reduced' | 'blocked'

export const REDUCED_THRESHOLD = 150
export const BLOCKED_THRESHOLD = 400

export function useGraphDegrade(atomCount: number) {
  const [confirmedAt, setConfirmedAt] = useState<number | null>(null)

  const isConfirmed = confirmedAt === atomCount && atomCount > BLOCKED_THRESHOLD

  let mode: RenderMode
  if (atomCount > BLOCKED_THRESHOLD && !isConfirmed) {
    mode = 'blocked'
  } else if (atomCount > REDUCED_THRESHOLD) {
    mode = 'reduced'
  } else {
    mode = 'full'
  }

  function confirmRender() {
    setConfirmedAt(atomCount)
  }

  return { mode, confirmRender }
}
