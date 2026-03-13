import { ACCENT } from '../../constants'
import { fmtElapsed } from '../../utils'

export default function RecordTab({ machines, assignments, activeSessions, savedFlash, onSelectMachine }) {
  const activeCount = Object.keys(activeSessions).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5 }}>
          TAP A MACHINE TO RECORD DOWNTIME
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          {activeCount > 0 ? `${activeCount} DOWN NOW` : 'ALL RUNNING'}
        </span>
      </div>

      {/* Machine grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: 10,
        marginBottom: 18,
      }}>
        {machines.map(({ id }) => {
          const isActive = !!activeSessions[id]
          const isFlash  = savedFlash === id
          const elapsed  = activeSessions[id]?.elapsed || 0

          return (
            <div
              key={id}
              className="mc"
              onClick={() => onSelectMachine(id)}
              style={{
                background: isFlash
                  ? '#10B98118'
                  : isActive
                    ? '#EF444418'
                    : 'var(--surface)',
                border: `1.5px solid ${
                  isFlash   ? '#10B981' :
                  isActive  ? 'var(--danger)' :
                  'var(--border)'
                }`,
              }}
            >
              {/* Status dot */}
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 8, height: 8, borderRadius: '50%',
                background: isFlash ? '#10B981' : isActive ? 'var(--danger)' : 'var(--border)',
                boxShadow: isActive ? '0 0 6px var(--danger)' : 'none',
                animation: isActive ? 'pulse 1.2s infinite' : 'none',
              }} />

              {/* Machine ID */}
              <div style={{
                fontFamily: 'var(--font-disp)',
                fontSize: 26,
                color: isFlash ? '#10B981' : isActive ? 'var(--danger)' : 'var(--text)',
                letterSpacing: 1,
                lineHeight: 1,
              }}>
                {id}
              </div>

              {/* Operator name */}
              <div style={{
                fontSize: 10, color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '100%', padding: '0 4px',
              }}>
                {assignments[id] || '—'}
              </div>

              {/* Live timer */}
              {isActive && (
                <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, color: 'var(--danger)', letterSpacing: 1, marginTop: 2 }}>
                  {fmtElapsed(elapsed)}
                </div>
              )}

              {/* Saved flash */}
              {isFlash && (
                <div style={{ fontSize: 10, color: '#10B981', marginTop: 2, letterSpacing: 0.5 }}>
                  SAVED ✓
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Active sessions bar */}
      {activeCount > 0 && (
        <div className="card">
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--danger)', marginBottom: 12 }}>
            ACTIVE SESSIONS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(activeSessions).map(([id, s]) => (
              <div
                key={id}
                onClick={() => onSelectMachine(id)}
                style={{
                  background: '#EF444411', border: '1px solid #EF444433',
                  borderRadius: 10, padding: '12px 18px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                  touchAction: 'manipulation',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-disp)', fontSize: 22, color: 'var(--danger)', letterSpacing: 1 }}>{id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.operator}</div>
                  {s.category && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{s.category}</div>}
                </div>
                <div style={{ fontFamily: 'var(--font-disp)', fontSize: 32, color: 'var(--danger)', letterSpacing: 2, animation: 'pulse 1s infinite' }}>
                  {fmtElapsed(s.elapsed)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
