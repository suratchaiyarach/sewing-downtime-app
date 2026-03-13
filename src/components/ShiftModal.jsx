import { useState } from 'react'
import { SHIFTS, ACCENT } from '../constants'

export default function ShiftModal({ sessionInfo, onSave, onClose }) {
  const [form, setForm] = useState({ ...sessionInfo })

  const handleSave = () => {
    onSave(form)
    onClose()
  }

  return (
    <div className="overlay-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal pop" style={{ border: `1px solid ${ACCENT}44`, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-disp)', fontSize: 26, color: ACCENT, letterSpacing: 2 }}>
            SESSION SETUP
          </div>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 20 }}>✕</button>
        </div>

        {/* Shift selector */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Shift</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SHIFTS.map(s => (
              <div
                key={s}
                className={`op-chip ${form.shift === s ? 'sel' : ''}`}
                style={{ justifyContent: 'flex-start', padding: '14px 16px', fontSize: 13 }}
                onClick={() => setForm(f => ({ ...f, shift: s }))}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Style / Order Number */}
        <div style={{ marginBottom: 24 }}>
          <label className="label">Style / Order Number (optional)</label>
          <input
            className="fi"
            type="text"
            placeholder="e.g. ST-2026-001"
            value={form.styleNumber}
            onChange={e => setForm(f => ({ ...f, styleNumber: e.target.value }))}
          />
        </div>

        {/* Preview */}
        <div style={{
          background: '#F59E0B11', border: '1px solid #F59E0B33',
          borderRadius: 8, padding: '10px 14px', marginBottom: 20,
          fontSize: 13, color: ACCENT,
        }}>
          {form.shift} &nbsp;{form.styleNumber ? `| ${form.styleNumber}` : ''}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '14px' }}>Cancel</button>
          <button className="btn-amber" onClick={handleSave} style={{ padding: '14px', fontSize: 15, letterSpacing: 1 }}>
            Save Session
          </button>
        </div>
      </div>
    </div>
  )
}
