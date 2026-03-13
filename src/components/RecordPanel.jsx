import { useState, useEffect } from 'react'
import { DOWNTIME_CATEGORIES, OPERATIONS, ACCENT } from '../constants'
import { fmtElapsed } from '../utils'

export default function RecordPanel({
  machineId, session, defaultOperator, operators,
  onStart, onUpdate, onStop, onCancel, onClose,
}) {
  const isRunning = !!session

  const [pendingOperator,  setPendingOperator]  = useState(defaultOperator)
  const [pendingOperation, setPendingOperation] = useState('')
  const [pendingCategory,  setPendingCategory]  = useState(session?.category || '')
  const [pendingNotes,     setPendingNotes]      = useState(session?.notes    || '')
  const [showOpPicker,     setShowOpPicker]      = useState(false)
  const [opSearch,         setOpSearch]          = useState('')

  // Sync category if session already has one (when reopening a running panel)
  useEffect(() => {
    if (session?.category) setPendingCategory(session.category)
  }, [session?.category])

  const filteredOps = operators.filter(op =>
    op.name.toLowerCase().includes(opSearch.toLowerCase())
  )

  const handleStart = () => {
    if (!pendingOperator) return
    onStart(machineId, { operator: pendingOperator, operation: pendingOperation })
  }

  const handleCategorySelect = (cat) => {
    setPendingCategory(cat)
    if (isRunning) onUpdate(machineId, { category: cat })
  }

  const handleStop = () => {
    onStop(machineId, { category: pendingCategory, notes: pendingNotes })
  }

  const handleCancel = () => {
    onCancel(machineId)
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className="panel slide-up"
        onClick={e => e.stopPropagation()}
        style={{ borderTop: `2px solid ${isRunning ? 'var(--danger)' : ACCENT}` }}
      >
        <div className="panel-handle" />

        {/* Machine + timer header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-disp)', fontSize: 52, color: isRunning ? 'var(--danger)' : ACCENT, letterSpacing: 3, lineHeight: 1 }}>
              {machineId}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, marginTop: 4 }}>
              {isRunning ? '⬤ DOWNTIME IN PROGRESS' : 'NEW DOWNTIME EVENT'}
            </div>
          </div>

          {isRunning && session && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-disp)', fontSize: 56, color: 'var(--danger)', letterSpacing: 2, lineHeight: 1, animation: 'pulse 1s infinite' }}>
                {fmtElapsed(session.elapsed)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: 1 }}>ELAPSED</div>
            </div>
          )}
        </div>

        {/* ── SETUP MODE ─────────────────────────────────────────────────── */}
        {!isRunning && (
          <div className="pop">
            {/* Operator picker */}
            <div style={{ marginBottom: 20 }}>
              <label className="label">Operator *</label>
              <div
                onClick={() => setShowOpPicker(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg)', border: `1px solid ${pendingOperator ? ACCENT : 'var(--border)'}`,
                  borderRadius: 10, padding: '14px', cursor: 'pointer', marginBottom: 6,
                  fontSize: 14, color: pendingOperator ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                <span>{pendingOperator || 'Tap to select operator…'}</span>
                <span style={{ color: 'var(--text-muted)' }}>{showOpPicker ? '▲' : '▼'}</span>
              </div>

              {showOpPicker && (
                <div className="pop" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                  <input
                    className="fi"
                    placeholder="Search name…"
                    value={opSearch}
                    onChange={e => setOpSearch(e.target.value)}
                    style={{ marginBottom: 10 }}
                    autoFocus
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, maxHeight: 230, overflowY: 'auto' }}>
                    {filteredOps.map(op => (
                      <div
                        key={op.id}
                        className={`op-chip ${pendingOperator === op.name ? 'sel' : ''}`}
                        onClick={() => { setPendingOperator(op.name); setShowOpPicker(false); setOpSearch('') }}
                      >
                        {op.name}
                      </div>
                    ))}
                    {filteredOps.length === 0 && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 12 }}>
                        No operators found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Operation chips */}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Operation (optional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {OPERATIONS.map(op => (
                  <div
                    key={op}
                    className={`op-chip ${pendingOperation === op ? 'sel' : ''}`}
                    style={{ fontSize: 11, padding: '12px 6px' }}
                    onClick={() => setPendingOperation(p => p === op ? '' : op)}
                  >
                    {op}
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn-amber"
              disabled={!pendingOperator}
              onClick={handleStart}
              style={{ width: '100%', padding: '20px', fontSize: 20, letterSpacing: 2 }}
            >
              ▶ START TIMER
            </button>
          </div>
        )}

        {/* ── RUNNING MODE ────────────────────────────────────────────────── */}
        {isRunning && session && (
          <div className="pop">
            {/* Session info strip */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>OPERATOR</div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{session.operator}</div>
              </div>
              {session.operation && (
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>OPERATION</div>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>{session.operation}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>START</div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{session.startTime}</div>
              </div>
            </div>

            {/* Category grid */}
            <div style={{ marginBottom: 20 }}>
              <label className="label">
                Downtime Reason *
                <span style={{ color: '#EF444488', marginLeft: 6 }}>(required to save)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {DOWNTIME_CATEGORIES.map(c => (
                  <div
                    key={c.label}
                    className={`cat-chip ${pendingCategory === c.label ? 'sel' : ''}`}
                    onClick={() => handleCategorySelect(c.label)}
                  >
                    <span style={{ fontSize: 26 }}>{c.icon}</span>
                    <span style={{ fontSize: 11, color: pendingCategory === c.label ? ACCENT : 'var(--text-muted)', lineHeight: 1.3 }}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Notes (optional)</label>
              <textarea
                className="fi"
                rows={2}
                placeholder="Root cause, action taken…"
                value={pendingNotes}
                onChange={e => setPendingNotes(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button className="btn-ghost" onClick={handleCancel} style={{ padding: '16px', fontSize: 13 }}>
                ✕ Cancel
              </button>
              <button
                className="btn-red"
                disabled={!pendingCategory}
                onClick={handleStop}
                style={{ padding: '18px', fontSize: 18, letterSpacing: 2 }}
              >
                ■ STOP &amp; SAVE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
