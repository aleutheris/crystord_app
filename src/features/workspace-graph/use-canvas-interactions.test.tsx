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

function makeHook(overrides?: Partial<{ selectedAtomId: string | null; atoms: ReturnType<typeof makeAtom>[] }>) {
  const atoms = overrides?.atoms ?? [makeAtom('a1', 'Alpha'), makeAtom('a2', 'Beta'), makeAtom('a3', 'Gamma')]
  const onSelectAtom = vi.fn()
  const { result } = renderHook(() =>
    useCanvasInteractions({
      atoms,
      edges: [],
      selectedAtomId: overrides?.selectedAtomId ?? null,
      onSelectAtom,
      deleteAtom: vi.fn(),
      createAtom: vi.fn(),
      addBond: vi.fn(),
      removeBond: vi.fn(),
    }),
  )
  return { result, onSelectAtom }
}

function pressKey(result: ReturnType<typeof makeHook>['result'], key: string) {
  act(() => {
    result.current.onKeyDown({
      key,
      target: document.createElement('div'),
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent)
  })
}

describe('useCanvasInteractions keyboard navigation (BI-260043 / REQ-FR-260032)', () => {
  it('ArrowRight advances selection to the next atom and calls onSelectAtom', () => {
    const { result, onSelectAtom } = makeHook({ selectedAtomId: 'a1' })
    pressKey(result, 'ArrowRight')
    expect(onSelectAtom).toHaveBeenCalledWith('a2')
  })

  it('ArrowDown advances selection to the next atom and calls onSelectAtom', () => {
    const { result, onSelectAtom } = makeHook({ selectedAtomId: 'a1' })
    pressKey(result, 'ArrowDown')
    expect(onSelectAtom).toHaveBeenCalledWith('a2')
  })

  it('ArrowLeft moves selection to the previous atom and calls onSelectAtom', () => {
    const { result, onSelectAtom } = makeHook({ selectedAtomId: 'a2' })
    pressKey(result, 'ArrowLeft')
    expect(onSelectAtom).toHaveBeenCalledWith('a1')
  })

  it('ArrowUp moves selection to the previous atom and calls onSelectAtom', () => {
    const { result, onSelectAtom } = makeHook({ selectedAtomId: 'a2' })
    pressKey(result, 'ArrowUp')
    expect(onSelectAtom).toHaveBeenCalledWith('a1')
  })

  it('ArrowRight wraps from the last atom to the first', () => {
    const { result, onSelectAtom } = makeHook({ selectedAtomId: 'a3' })
    pressKey(result, 'ArrowRight')
    expect(onSelectAtom).toHaveBeenCalledWith('a1')
  })

  it('ArrowLeft wraps from the first atom to the last', () => {
    const { result, onSelectAtom } = makeHook({ selectedAtomId: 'a1' })
    pressKey(result, 'ArrowLeft')
    expect(onSelectAtom).toHaveBeenCalledWith('a3')
  })

  it('Escape clears selection by calling onSelectAtom(null)', () => {
    const { result, onSelectAtom } = makeHook({ selectedAtomId: 'a1' })
    pressKey(result, 'Escape')
    expect(onSelectAtom).toHaveBeenCalledWith(null)
  })

  it('pane click clears selection by calling onSelectAtom(null)', () => {
    const onSelectAtom = vi.fn()
    const { result } = renderHook(() =>
      useCanvasInteractions({
        atoms: [makeAtom('a1')],
        edges: [],
        selectedAtomId: 'a1',
        onSelectAtom,
        deleteAtom: vi.fn(),
        createAtom: vi.fn(),
        addBond: vi.fn(),
        removeBond: vi.fn(),
      }),
    )
    act(() => { result.current.onPaneClick() })
    expect(onSelectAtom).toHaveBeenCalledWith(null)
  })
})

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
