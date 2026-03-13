import { ACCENT } from '../constants'

export default function Header({ sessionInfo, lineNames, activeCount, onChangeLine, onEditShift, onExportCSV }) {
  const { lineName, shift, styleNumber } = sessionInfo

  return (
    <header className="app-header">
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-disp)', fontSize: 28, color: ACCENT, letterSpacing: 3 }}>DOWNTIME</span>
          <span style={{ fontFamily: 'var(--font-disp)', fontSize: 28, color: 'var(--text)', letterSpacing: 2 }}>STUDY</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2, marginLeft: 4 }}>SEWING</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--danger)', letterSpacing: 1, animation: 'pulse 1.4s infinite' }}>
              ● {activeCount} DOWN
            </span>
          )}
          <button className="btn-ghost" onClick={onExportCSV} style={{ padding: '8px 12px', fontSize: 11, minHeight: 36 }}>
            ⬇ CSV
          </button>
        </div>
      </div>

      {/* Session banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#F59E0B11', border: '1px solid #F59E0B33',
        borderRadius: 8, padding: '6px 10px', marginBottom: 10,
      }}>
        <span style={{ fontSize: 14 }}>🏭</span>

        {/* Line dropdown */}
        <select
          className="fi"
          value={lineName}
          onChange={e => onChangeLine(e.target.value)}
          style={{
            flex: 1, padding: '4px 8px', fontSize: 13,
            color: ACCENT, fontWeight: 500, background: 'transparent',
            border: 'none', outline: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {lineNames.map(n => (
            <option key={n} value={n} style={{ background: 'var(--surface)', color: 'var(--text)' }}>{n}</option>
          ))}
        </select>

        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>|</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{shift}</span>
        {styleNumber && (
          <>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>|</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{styleNumber}</span>
          </>
        )}

        <button
          onClick={onEditShift}
          style={{
            marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 6px', whiteSpace: 'nowrap',
          }}
        >
          ✏ Edit
        </button>
      </div>
    </header>
  )
}
