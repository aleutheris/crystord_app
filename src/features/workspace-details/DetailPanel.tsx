import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Atom } from '../../api-contract/graph-queries'
import { C_BORDER, C_CARD_BG, C_ERROR, C_TEXT_MUTED } from '../../styles/tokens'

interface DetailPanelProps {
  atom?: Atom
  isCreationMode?: boolean
  onCreate?: (title: string, labels: string[], description: string, content: string) => Promise<void>
  onUpdate?: (uuid: string, atom: Atom) => Promise<void>
  onDelete?: (uuid: string) => void
  onClose: () => void
}

export function DetailPanel({ atom, isCreationMode, onCreate, onUpdate, onDelete, onClose }: DetailPanelProps) {
  const uuid = atom?.properties.shellies.uuid ?? ''
  const [title, setTitle] = useState(atom?.properties.nuclearies.title ?? '')
  const [description, setDescription] = useState(atom?.properties.nuclearies.description ?? '')
  const [content, setContent] = useState(atom?.properties.nuclearies.content ?? '')
  const [labels, setLabels] = useState(atom?.labels.join(', ') ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const parsedLabels = labels.split(',').map((l) => l.trim()).filter(Boolean)
      if (isCreationMode && onCreate) {
        await onCreate(title, parsedLabels, description, content)
      } else if (atom && onUpdate) {
        const updated: Atom = {
          ...atom,
          labels: parsedLabels,
          properties: {
            ...atom.properties,
            nuclearies: { ...atom.properties.nuclearies, title, description, content },
          },
        }
        await onUpdate(uuid, updated)
      }
    } finally {
      setSaving(false)
    }
  }

  const panelLabel = isCreationMode ? 'Create atom' : 'Atom details'

  return (
    <aside
      aria-label={panelLabel}
      style={{
        width: 320,
        height: isCreationMode ? '100%' : undefined,
        borderLeft: `1px solid ${C_BORDER}`,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: C_CARD_BG,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>
          {isCreationMode ? 'Create New Atom' : 'Atom Details'}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
        <div>
          <label htmlFor="detail-title" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Title</label>
          <input id="detail-title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '0.4rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="detail-labels" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Labels (comma-separated)</label>
          <input id="detail-labels" value={labels} onChange={(e) => setLabels(e.target.value)} style={{ width: '100%', padding: '0.4rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="detail-description" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description</label>
          <textarea id="detail-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '0.4rem', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>
        <div>
          <label htmlFor="detail-content" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Content</label>
          <textarea id="detail-content" value={content} onChange={(e) => setContent(e.target.value)} rows={4} style={{ width: '100%', padding: '0.4rem', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          <button type="submit" disabled={saving} style={{ padding: '0.4rem 1rem' }}>
            {saving ? (isCreationMode ? 'Creating…' : 'Saving…') : (isCreationMode ? 'Create' : 'Save')}
          </button>
          {!isCreationMode && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(uuid)}
              style={{ padding: '0.4rem 1rem', color: C_ERROR, marginLeft: 'auto' }}
            >
              Delete
            </button>
          )}
        </div>
      </form>

      {!isCreationMode && uuid && (
        <div style={{ fontSize: '0.7rem', color: C_TEXT_MUTED, marginTop: '0.75rem' }}>
          UUID: {uuid}
        </div>
      )}
    </aside>
  )
}
