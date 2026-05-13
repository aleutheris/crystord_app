import { describe, it, expect } from 'vitest'
import { floatingEdgePath } from './graph-geometry'

describe('floatingEdgePath', () => {
  it('returns null when source and target centers are coincident', () => {
    const c = { x: 100, y: 100, radius: 40 }
    expect(floatingEdgePath(c, c)).toBeNull()
  })

  it('returns an SVG M L path string for separated circles', () => {
    const path = floatingEdgePath(
      { x: 0, y: 0, radius: 40 },
      { x: 200, y: 0, radius: 40 },
    )
    expect(path).toMatch(/^M .+ L .+$/)
  })

  it('source anchor lies exactly on the source circle boundary (horizontal)', () => {
    const path = floatingEdgePath(
      { x: 0, y: 0, radius: 40 },
      { x: 200, y: 0, radius: 40 },
    )!
    // M 40 0 L 160 0  — source anchor is (40, 0): distance from center (0,0) should be 40
    const [, sx, sy] = path.match(/M ([\d.]+) ([\d.]+)/)!.map(Number)
    expect(Math.round(Math.sqrt(sx! * sx! + sy! * sy!))).toBe(40)
  })

  it('target anchor lies exactly on the target circle boundary (horizontal)', () => {
    const path = floatingEdgePath(
      { x: 0, y: 0, radius: 40 },
      { x: 200, y: 0, radius: 40 },
    )!
    // Target center is (200, 0), target anchor should be (160, 0): distance = 40
    const [, tx, ty] = path.match(/L ([\d.]+) ([\d.]+)/)!.map(Number)
    const distToTarget = Math.sqrt((tx! - 200) * (tx! - 200) + (ty! - 0) * (ty! - 0))
    expect(Math.round(distToTarget)).toBe(40)
  })

  it('computes correct anchor for diagonal direction', () => {
    // 45-degree diagonal: anchors should be at r * cos(45°) ≈ r * 0.707
    const path = floatingEdgePath(
      { x: 0, y: 0, radius: 40 },
      { x: 100, y: 100, radius: 40 },
    )
    expect(path).not.toBeNull()
  })

  it('returns null when centers are less than 1 unit apart', () => {
    expect(
      floatingEdgePath({ x: 0, y: 0, radius: 40 }, { x: 0.5, y: 0, radius: 40 }),
    ).toBeNull()
  })
})
