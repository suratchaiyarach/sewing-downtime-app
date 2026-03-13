import { useState } from 'react'
import { DOWNTIME_CATEGORIES, OPERATIONS, ACCENT, CHART_COLORS } from '../constants'
import { calcDuration } from '../utils'

export default function EditRecordModal({ record, machines, operators, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    date:      record.date      || '',
    machine:   record.machine   || '',
    operator:  record.operator  || '',
    operation: record.operation || '',
    category:  record.category  || '',
    startTime: record.startTime || '',
    endTime:   record.endTime   || '',
    notes:     record.notes     || '',
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const duration = calcDuration(form.startTime, form.endTime)

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    onSave(record.id, { ...form, duration: Math.max(1, duration) })
  }

  const catIdx = DOWNTIME_CATEGORIES.findIndex(c => c.label === form.category)

  return (
    <div className="overlay-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal pop" style={{ border: `1px solid ${ACCENT}44` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-disp)', fontSize: 28, color: ACCENT, letterSpacing: 2 }}>
              EDIT RECORD
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
              ID {record.id}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 20 }}>✕</button>
        </div>

        {/* Row 1: Date + Machine + Operator */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="label">Date</label>
            <input className="fi" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Machine</label>
            <select className="fi" value={form.machine} onChange={e => setField('machine', e.target.value)}>
              {machines.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Operator</label>
            <select className="fi" value={form.operator} onChange={e => setField('operator', e.target.value)}>
              {operators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Operation + Start + End + Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="label">Operation</label>
            <select className="fi" value={form.operation} onChange={e => setField('operation', e.target.value)}>
              <option value="—">—</option>
              {OPERATIONS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start</label>
            <input className="fi" type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
          </div>
          <div>
            <label className="label">End</label>
            <input className="fi" type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} />
          </div>
          <div>
            <label className="label">Duration</label>
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '13px 14px', fontSize: 14,
              color: duration > 0 ? ACCENT : 'var(--text-muted)',
            }}>
              {duration > 0 ? `${duration}m` : '—'}
            </div>
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <label className="label">Downtime Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
            {DOWNTIME_CATEGORIES.map(c => (
              <div
                key={c.label}
                className={`cat-chip ${form.category === c.label ? 'sel' : ''}`}
                style={{ minHeight: 64, padding: '10px 6px' }}
                onClick={() => setField('category', c.label)}
              >
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontSize: 10, color: form.category === c.label ? ACCENT : 'var(--text-muted)', lineHeight: 1.2 }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label className="label">Notes</label>
          <textarea
            className="fi"
            rows={2}
            placeholder="Root cause, action taken…"
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        {/* Category badge preview */}
        {form.category && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Category:</span>
            <span className="badge" style={{
              background: CHART_COLORS[catIdx >= 0 ? catIdx % CHART_COLORS.length : 0] + '22',
              color:       CHART_COLORS[catIdx >= 0 ? catIdx % CHART_COLORS.length : 0],
            }}>
              {form.category}
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!confirmDelete ? (
            <>
              <button
                className="btn-ghost"
                onClick={() => setConfirmDelete(true)}
                style={{ padding: '14px 16px', color: 'var(--danger)', borderColor: '#EF444433', fontSize: 13 }}
              >
                🗑 Delete
              </button>
              <button className="btn-ghost" onClick={onClose} style={{ padding: '14px 16px', fontSize: 13 }}>
                Cancel
              </button>
              <button
                className="btn-amber"
                onClick={handleSave}
                style={{ flex: 1, padding: '14px', fontSize: 15, letterSpacing: 1 }}
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flex: 1 }}>
                Delete this record?
              </span>
              <button className="btn-ghost" onClick={() => setConfirmDelete(false)} style={{ padding: '14px 16px', fontSize: 13 }}>
                No
              </button>
              <button
                className="btn-red"
                onClick={() => onDelete(record.id)}
                style={{ padding: '14px 24px', fontSize: 14, letterSpacing: 1 }}
              >
                Yes, Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
