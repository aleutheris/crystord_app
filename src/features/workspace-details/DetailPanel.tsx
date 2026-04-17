import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Atom } from '../../api-contract/graph-queries'

interface DetailPanelProps {
  atom: Atom
  onUpdate: (uuid: string, atom: Atom) => Promise<void>
  onDelete: (uuid: string) => void
  onClose: () => void
}

export function DetailPanel({ atom, onUpdate, onDelete, onClose }: DetailPanelProps) {
  const uuid = atom.properties.shellies.uuid
  const [title, setTitle] = useState(atom.properties.nuclearies.title)
  const [description, setDescription] = useState(atom.properties.nuclearies.description)
  const [content, setContent] = useState(atom.properties.nuclearies.content)
  const [labels, setLabels] = useState(atom.labels.join(', '))
  const [saving, setSaving] = useState(false)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated: Atom = {
        ...atom,
        labels: labels.split(',').map((l) => l.trim()).filter(Boolean),
        properties: {
          ...atom.properties,
          nuclearies: { ...atom.properties.nuclearies, title, description, content },
        },
      }
      await onUpdate(uuid, updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <aside
      aria-label="Atom details"
      style={{
        width: 320,
        borderLeft: '1px solid #ddd',
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Atom Details</h2>
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
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(uuid)}
            style={{ padding: '0.4rem 1rem', color: '#d93025', marginLeft: 'auto' }}
          >
            Delete
          </button>
        </div>
      </form>

      <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.75rem' }}>
        UUID: {uuid}
      </div>
    </aside>
  )
}
