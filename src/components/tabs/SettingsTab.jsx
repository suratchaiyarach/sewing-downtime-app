import { useState } from 'react'
import { ACCENT } from '../../constants'

// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  )
}

// ── Inline edit field ────────────────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)

  const commit = () => {
    if (draft.trim()) onSave(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
        <input
          className="fi"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
          placeholder={placeholder}
        />
        <button className="btn-amber" onClick={commit} style={{ padding: '8px 14px', minHeight: 40, fontSize: 12 }}>✓</button>
        <button className="btn-ghost" onClick={() => setEditing(false)} style={{ padding: '8px 12px', minHeight: 40 }}>✕</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{value}</span>
      <button className="btn-icon" onClick={() => { setDraft(value); setEditing(true) }} title="Edit">✏</button>
    </div>
  )
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 10, letterSpacing: 2, color: ACCENT }}>{title}</span>
      {count !== undefined && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{count} items</span>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
export default function SettingsTab({
  lineConfig, lineName, lineNames, records,
  onAddLine, onRemoveLine,
  onAddMachine, onUpdateMachine, onRemoveMachine,
  onAddOperator, onUpdateOperator, onRemoveOperator,
  onUpdateAssignment,
}) {
  const [activeSection, setActiveSection] = useState('machines')
  const [newMachineId,  setNewMachineId]  = useState('')
  const [newOpName,     setNewOpName]     = useState('')
  const [newLineName,   setNewLineName]   = useState('')

  // Only records belonging to this line can block deletion
  const lineRecords   = records.filter(r => r.lineName === lineName)
  const usedMachines  = new Set(lineRecords.map(r => r.machine))
  const usedOperators = new Set(lineRecords.map(r => r.operator))

  const operatorNames = lineConfig.operators.map(op => op.name)

  return (
    <div>
      {/* Active line banner */}
      <div style={{
        background: '#F59E0B11', border: '1px solid #F59E0B33',
        borderRadius: 8, padding: '10px 14px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>🏭</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>SETTINGS FOR:</span>
        <span style={{ fontSize: 13, color: ACCENT, fontWeight: 500 }}>{lineName}</span>
        <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>
          Change line in header banner
        </span>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'machines',  label: '⚙ Machines'  },
          { id: 'operators', label: '👤 Operators' },
          { id: 'lines',     label: '🏭 Lines'     },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '10px 18px',
              border: `1px solid ${activeSection === s.id ? ACCENT : 'var(--border)'}`,
              borderRadius: 10,
              background: activeSection === s.id ? '#F59E0B18' : 'none',
              color: activeSection === s.id ? ACCENT : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: 1,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── MACHINES SECTION ──────────────────────────────────────────────── */}
      {activeSection === 'machines' && (
        <div className="card">
          <SectionHeader title="MACHINES" count={lineConfig.machines.length} />

          <div style={{ marginBottom: 20 }}>
            {lineConfig.machines.map(m => (
              <div key={m.id} className="settings-row">
                <Toggle
                  checked={m.enabled}
                  onChange={val => onUpdateMachine(m.id, { enabled: val })}
                />
                <span style={{
                  fontFamily: 'var(--font-disp)', fontSize: 20,
                  color: m.enabled ? ACCENT : 'var(--text-muted)',
                  letterSpacing: 1, minWidth: 60,
                }}>
                  {m.id}
                </span>
                <select
                  className="fi"
                  value={lineConfig.assignments[m.id] || ''}
                  onChange={e => onUpdateAssignment(m.id, e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', fontSize: 12, maxWidth: 200 }}
                >
                  <option value="">— Unassigned —</option>
                  {operatorNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <button
                  className="btn-icon"
                  onClick={() => onRemoveMachine(m.id)}
                  disabled={usedMachines.has(m.id)}
                  title={usedMachines.has(m.id) ? 'Cannot remove: has records on this line' : 'Remove machine'}
                  style={{
                    color: usedMachines.has(m.id) ? 'var(--text-dim)' : 'var(--danger)',
                    cursor: usedMachines.has(m.id) ? 'not-allowed' : 'pointer',
                  }}
                >
                  🗑
                </button>
              </div>
            ))}

            {lineConfig.machines.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 12 }}>
                No machines for this line yet — add one below
              </div>
            )}
          </div>

          <div>
            <label className="label">Add New Machine</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="fi"
                placeholder="e.g. M-21"
                value={newMachineId}
                onChange={e => setNewMachineId(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newMachineId.trim()) {
                    onAddMachine(newMachineId.trim()); setNewMachineId('')
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                className="btn-amber"
                disabled={!newMachineId.trim()}
                onClick={() => { onAddMachine(newMachineId.trim()); setNewMachineId('') }}
                style={{ padding: '0 20px', minHeight: 50, fontSize: 13, letterSpacing: 1 }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OPERATORS SECTION ─────────────────────────────────────────────── */}
      {activeSection === 'operators' && (
        <div className="card">
          <SectionHeader title="OPERATORS" count={lineConfig.operators.length} />

          <div style={{ marginBottom: 20 }}>
            {lineConfig.operators.map(op => (
              <div key={op.id} className="settings-row">
                <InlineEdit
                  value={op.name}
                  onSave={name => onUpdateOperator(op.id, name)}
                />
                <button
                  className="btn-icon"
                  onClick={() => onRemoveOperator(op.id)}
                  disabled={usedOperators.has(op.name)}
                  title={usedOperators.has(op.name) ? 'Cannot remove: has records on this line' : 'Remove operator'}
                  style={{
                    color: usedOperators.has(op.name) ? 'var(--text-dim)' : 'var(--danger)',
                    cursor: usedOperators.has(op.name) ? 'not-allowed' : 'pointer',
                  }}
                >
                  🗑
                </button>
              </div>
            ))}

            {lineConfig.operators.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 12 }}>
                No operators for this line yet — add one below
              </div>
            )}
          </div>

          <div>
            <label className="label">Add New Operator</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="fi"
                placeholder="Full name"
                value={newOpName}
                onChange={e => setNewOpName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newOpName.trim()) {
                    onAddOperator(newOpName.trim()); setNewOpName('')
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                className="btn-amber"
                disabled={!newOpName.trim()}
                onClick={() => { onAddOperator(newOpName.trim()); setNewOpName('') }}
                style={{ padding: '0 20px', minHeight: 50, fontSize: 13, letterSpacing: 1 }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LINES SECTION ─────────────────────────────────────────────────── */}
      {activeSection === 'lines' && (
        <div className="card">
          <SectionHeader title="LINES" count={lineNames.length} />

          <div style={{ marginBottom: 20 }}>
            {lineNames.map(name => {
              const hasRecords = records.some(r => r.lineName === name)
              const isActive   = name === lineName
              return (
                <div key={name} className="settings-row">
                  <span style={{
                    fontSize: 13, color: isActive ? ACCENT : 'var(--text)', flex: 1,
                  }}>
                    {name}
                    {isActive && (
                      <span style={{ fontSize: 10, color: ACCENT, marginLeft: 8, letterSpacing: 1 }}>
                        ← active
                      </span>
                    )}
                  </span>
                  <button
                    className="btn-icon"
                    onClick={() => onRemoveLine(name)}
                    disabled={hasRecords || isActive}
                    title={
                      isActive    ? 'Cannot remove active line — switch to another line first' :
                      hasRecords  ? 'Cannot remove: line has records' :
                                    'Remove line'
                    }
                    style={{
                      color: (hasRecords || isActive) ? 'var(--text-dim)' : 'var(--danger)',
                      cursor: (hasRecords || isActive) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    🗑
                  </button>
                </div>
              )
            })}

            {lineNames.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 12 }}>
                No lines configured — add one below
              </div>
            )}
          </div>

          <div>
            <label className="label">Add New Line</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="fi"
                placeholder="e.g. Sewing Line 2"
                value={newLineName}
                onChange={e => setNewLineName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newLineName.trim()) {
                    onAddLine(newLineName.trim()); setNewLineName('')
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                className="btn-amber"
                disabled={!newLineName.trim()}
                onClick={() => { onAddLine(newLineName.trim()); setNewLineName('') }}
                style={{ padding: '0 20px', minHeight: 50, fontSize: 13, letterSpacing: 1 }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data info */}
      <div style={{ marginTop: 20, padding: 14, background: 'var(--surface2)', borderRadius: 10, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--text-dim)', marginBottom: 6 }}>DATA INFO</div>
        Records on <span style={{ color: ACCENT }}>{lineName}</span>: <span style={{ color: 'var(--text)' }}>{lineRecords.length}</span><br />
        Total records (all lines): <span style={{ color: 'var(--text)' }}>{records.length}</span><br />
        Storage: <span style={{ color: 'var(--text)' }}>localStorage (browser)</span><br />
        <span style={{ color: 'var(--text-dim)' }}>Data persists until you clear browser storage. Export CSV regularly to back up.</span>
      </div>
    </div>
  )
}
