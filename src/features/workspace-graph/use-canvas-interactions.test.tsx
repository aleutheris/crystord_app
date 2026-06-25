import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Edge, Connection } from '@xyflow/react'
import type { EffectiveAccessLevel } from '../../api-contract/graph-queries'
import { useCanvasInteractions } from './use-canvas-interactions'

function makeAtom(id: string, title = 'Atom', accessLevel: EffectiveAccessLevel = 'OWNER') {
  return {
    labels: ['Node'],
    bonds: [],
    accessLevel,
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

describe('useCanvasInteractions access-level gating (BI-260061 / REQ-FR-260069)', () => {
  const connection = (source: string, target: string): Connection => ({
    source, target, sourceHandle: null, targetHandle: null,
  })

  it('opens the bond dialog when connecting from an owner/editor source', () => {
    const { result } = makeHook() // default OWNER
    act(() => { result.current.onConnect(connection('a1', 'a2')) })
    expect(result.current.pendingConnection).toEqual({ source: 'a1', target: 'a2' })
  })

  it('allows an EDITOR to bond from their source', () => {
    const atoms = [makeAtom('a1', 'Alpha', 'EDITOR'), makeAtom('a2', 'Beta', 'OWNER')]
    const { result } = makeHook({ atoms })
    act(() => { result.current.onConnect(connection('a1', 'a2')) })
    expect(result.current.pendingConnection).toEqual({ source: 'a1', target: 'a2' })
  })

  it('ignores a bond drawn from a view-only source', () => {
    const atoms = [makeAtom('a1', 'Alpha', 'VIEWER'), makeAtom('a2', 'Beta', 'OWNER')]
    const { result } = makeHook({ atoms })
    act(() => { result.current.onConnect(connection('a1', 'a2')) })
    expect(result.current.pendingConnection).toBeNull()
  })

  it('does not open delete confirmation for a view-only atom on Delete', () => {
    const { result } = makeHook({ atoms: [makeAtom('a1', 'Alpha', 'VIEWER')], selectedAtomId: 'a1' })
    pressKey(result, 'Delete')
    expect(result.current.confirmDelete).toBeNull()
  })

  it('does not open delete confirmation for an EDITOR (destroy is owner-only)', () => {
    const { result } = makeHook({ atoms: [makeAtom('a1', 'Alpha', 'EDITOR')], selectedAtomId: 'a1' })
    pressKey(result, 'Delete')
    expect(result.current.confirmDelete).toBeNull()
  })

  function bondHook(sourceLevel: EffectiveAccessLevel, removeBond = vi.fn()) {
    const sourceAtom = { ...makeAtom('a1', 'Alpha', sourceLevel), bonds: [{ uuid: 'a2', name: 'REL', direction: 'from' }] }
    const edges: Edge[] = [{ id: 'e1', source: 'a1', target: 'a2', label: 'REL', selected: true }]
    const { result } = renderHook(() =>
      useCanvasInteractions({
        atoms: [sourceAtom, makeAtom('a2', 'Beta')],
        edges,
        selectedAtomId: 'a1',
        onSelectAtom: vi.fn(),
        deleteAtom: vi.fn(),
        createAtom: vi.fn(),
        addBond: vi.fn(),
        removeBond,
      }),
    )
    return { result, removeBond }
  }

  it('removes a bond from an editable source via Delete on a selected edge', async () => {
    const { result, removeBond } = bondHook('EDITOR', vi.fn().mockResolvedValue(undefined))
    await act(async () => {
      result.current.onKeyDown({ key: 'Delete', target: document.createElement('div'), preventDefault: vi.fn() } as unknown as React.KeyboardEvent)
    })
    expect(removeBond).toHaveBeenCalledWith('a1', 'a2', 'REL')
  })

  it('does not remove a bond from a view-only source', async () => {
    const { result, removeBond } = bondHook('VIEWER')
    await act(async () => {
      result.current.onKeyDown({ key: 'Delete', target: document.createElement('div'), preventDefault: vi.fn() } as unknown as React.KeyboardEvent)
    })
    expect(removeBond).not.toHaveBeenCalled()
  })
})
