import { useState, useMemo } from 'react'
import { DOWNTIME_CATEGORIES, CHART_COLORS, ACCENT } from '../../constants'
import { fmtDur } from '../../utils'

const SORT_FIELDS = [
  { key: 'date',      label: 'Date'      },
  { key: 'machine',   label: 'Machine'   },
  { key: 'operator',  label: 'Operator'  },
  { key: 'operation', label: 'Operation' },
  { key: 'category',  label: 'Category'  },
  { key: 'duration',  label: 'Min'       },
]

function catColor(category) {
  const idx = DOWNTIME_CATEGORIES.findIndex(c => c.label === category)
  return CHART_COLORS[idx >= 0 ? idx % CHART_COLORS.length : CHART_COLORS.length - 1]
}

export default function LogTab({ records, machines, onEdit }) {
  const [filterMachine, setFilterMachine] = useState('All')
  const [filterDate,    setFilterDate]    = useState('')
  const [sortField,     setSortField]     = useState('date')
  const [sortDir,       setSortDir]       = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let r = [...records]
    if (filterMachine !== 'All') r = r.filter(x => x.machine === filterMachine)
    if (filterDate) r = r.filter(x => x.date === filterDate)
    r.sort((a, b) => {
      let av = a[sortField], bv = b[sortField]
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase() }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return r
  }, [records, filterMachine, filterDate, sortField, sortDir])

  const totalFiltered = filtered.reduce((s, r) => s + r.duration, 0)

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label className="label">Machine</label>
          <select className="fi" style={{ width: 110 }} value={filterMachine} onChange={e => setFilterMachine(e.target.value)}>
            <option>All</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input className="fi" style={{ width: 155 }} type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
        {filterDate && (
          <button className="btn-ghost" onClick={() => setFilterDate('')} style={{ padding: '10px 12px', minHeight: 44 }}>✕</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {filtered.length} records · {fmtDur(totalFiltered)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {SORT_FIELDS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{
                    padding: '10px 10px',
                    textAlign: 'left',
                    fontSize: 9,
                    letterSpacing: 1.5,
                    color: sortField === key ? ACCENT : 'var(--text-muted)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {label}{sortField === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
              <th style={{ padding: '10px 10px', fontSize: 9, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Notes
              </th>
              <th style={{ padding: '10px 10px', width: 48 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={r.id}
                className="tr-hover"
                style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : '#12151D' }}
              >
                <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{r.date}</td>
                <td style={{ padding: '10px 10px' }}>
                  <span style={{ color: ACCENT, fontWeight: 500 }}>{r.machine}</span>
                </td>
                <td style={{ padding: '10px 10px', color: 'var(--text)' }}>{r.operator}</td>
                <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{r.operation}</td>
                <td style={{ padding: '10px 10px' }}>
                  <span className="badge" style={{ background: catColor(r.category) + '22', color: catColor(r.category) }}>
                    {r.category}
                  </span>
                </td>
                <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                  <span style={{ color: r.duration >= 30 ? 'var(--danger)' : r.duration >= 15 ? '#F97316' : '#10B981', fontWeight: 500 }}>
                    {r.duration}
                  </span>
                </td>
                <td style={{ padding: '10px 10px', color: 'var(--text-dim)', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.notes || '—'}
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                  <button className="btn-icon" onClick={() => onEdit(r)} title="Edit record">
                    ✏
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>
                  NO RECORDS FOUND
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
