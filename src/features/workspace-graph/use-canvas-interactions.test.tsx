import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Edge } from '@xyflow/react'
import { useCanvasInteractions } from './use-canvas-interactions'

function makeAtom(id: string, title = 'Atom') {
  return {
    labels: ['Node'],
    bonds: [],
    properties: {
      shellies: { uuid: id },
      nuclearies: { title, description: '', content: '', operation: null, constants: null },
    },
  }
}

describe('useCanvasInteractions keyboard deletion policy', () => {
  it('opens delete confirmation for selected atom on Delete key', () => {
    const atoms = [makeAtom('a1', 'Alpha')]
    const onSelectAtom = vi.fn()
    const preventDefault = vi.fn()

    const { result } = renderHook(() =>
      useCanvasInteractions({
        atoms,
        edges: [],
        selectedAtomId: 'a1',
        onSelectAtom,
        deleteAtom: vi.fn(),
        createAtom: vi.fn(),
        addBond: vi.fn(),
        removeBond: vi.fn(),
      }),
    )

    act(() => {
      result.current.onKeyDown({
        key: 'Delete',
        target: document.createElement('div'),
        preventDefault,
      } as unknown as React.KeyboardEvent)
    })

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(result.current.confirmDelete?.properties.shellies.uuid).toBe('a1')
  })

  it('does not open delete confirmation for Backspace key', () => {
    const atoms = [makeAtom('a1', 'Alpha')]
    const onSelectAtom = vi.fn()
    const preventDefault = vi.fn()

    const { result } = renderHook(() =>
      useCanvasInteractions({
        atoms,
        edges: [],
        selectedAtomId: 'a1',
        onSelectAtom,
        deleteAtom: vi.fn(),
        createAtom: vi.fn(),
        addBond: vi.fn(),
        removeBond: vi.fn(),
      }),
    )

    act(() => {
      result.current.onKeyDown({
        key: 'Backspace',
        target: document.createElement('div'),
        preventDefault,
      } as unknown as React.KeyboardEvent)
    })

    expect(preventDefault).not.toHaveBeenCalled()
    expect(result.current.confirmDelete).toBeNull()
  })

  it('does not trigger deletion when Delete is pressed inside input fields', () => {
    const atoms = [makeAtom('a1', 'Alpha')]
    const onSelectAtom = vi.fn()
    const preventDefault = vi.fn()

    const { result } = renderHook(() =>
      useCanvasInteractions({
        atoms,
        edges: [] as Edge[],
        selectedAtomId: 'a1',
        onSelectAtom,
        deleteAtom: vi.fn(),
        createAtom: vi.fn(),
        addBond: vi.fn(),
        removeBond: vi.fn(),
      }),
    )

    act(() => {
      result.current.onKeyDown({
        key: 'Delete',
        target: document.createElement('input'),
        preventDefault,
      } as unknown as React.KeyboardEvent)
    })

    expect(preventDefault).not.toHaveBeenCalled()
    expect(result.current.confirmDelete).toBeNull()
  })
})
