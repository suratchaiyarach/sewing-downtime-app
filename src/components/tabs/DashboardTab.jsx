import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
  ComposedChart, ReferenceLine, Legend,
} from 'recharts'
import { DOWNTIME_CATEGORIES, ACCENT, CHART_COLORS } from '../../constants'
import { fmtDur } from '../../utils'

const TOOLTIP_STYLE = {
  background: '#1A1D26',
  border: '1px solid #1E2333',
  borderRadius: 8,
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
}

export default function DashboardTab({ records, lineName }) {
  // ── Filter to current line ─────────────────────────────────────────────
  const lineRecords = useMemo(
    () => records.filter(r => r.lineName === lineName),
    [records, lineName]
  )

  // ── Aggregations ───────────────────────────────────────────────────────
  const byCategory = useMemo(() => {
    const m = {}
    lineRecords.forEach(r => { m[r.category] = (m[r.category] || 0) + r.duration })
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [lineRecords])

  const byMachine = useMemo(() => {
    const m = {}
    lineRecords.forEach(r => { m[r.machine] = (m[r.machine] || 0) + r.duration })
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [lineRecords])

  const byDate = useMemo(() => {
    const m = {}
    lineRecords.forEach(r => { m[r.date] = (m[r.date] || 0) + r.duration })
    return Object.entries(m)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, mins]) => ({ date: date.slice(5), mins }))
  }, [lineRecords])

  // ── Pareto data ────────────────────────────────────────────────────────
  const paretoData = useMemo(() => {
    if (!byCategory.length) return []
    const total = byCategory.reduce((s, c) => s + c.value, 0)
    let cumSum = 0
    return byCategory.map(c => {
      cumSum += c.value
      return {
        name:   c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
        value:  c.value,
        cumPct: Math.round((cumSum / total) * 100),
      }
    })
  }, [byCategory])

  const totalMins   = lineRecords.reduce((s, r) => s + r.duration, 0)
  const avgPerEvent = lineRecords.length ? Math.round(totalMins / lineRecords.length) : 0
  const topCat      = byCategory[0]

  if (!lineRecords.length) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60, fontSize: 13, letterSpacing: 1 }}>
        <div style={{ fontSize: 11, color: ACCENT, letterSpacing: 2, marginBottom: 12 }}>
          LINE: {lineName}
        </div>
        NO RECORDS FOR THIS LINE YET — START RECORDING TO SEE ANALYTICS
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Active line indicator ───────────────────────────────────────── */}
      <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT }}>
        LINE: {lineName}
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {[
          { label: 'Total Downtime',    value: fmtDur(totalMins),          sub: `${lineRecords.length} events`,          color: ACCENT          },
          { label: 'Avg / Event',       value: `${avgPerEvent}m`,           sub: 'per incident',                       color: '#3B82F6'        },
          { label: 'Machines Affected', value: byMachine.length,            sub: 'unique machines',                    color: '#10B981'        },
          { label: 'Top Category',      value: (topCat?.name || '—').split(' ')[0], sub: fmtDur(topCat?.value || 0), color: 'var(--danger)'  },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 4 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-disp)', color: s.color, letterSpacing: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Category pie + Daily trend ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Pie chart */}
        <div className="card">
          <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 14 }}>BY CATEGORY</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ResponsiveContainer width="52%" height={190}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={76} dataKey="value" stroke="none">
                  {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [`${v} min`, '']} contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, overflow: 'hidden' }}>
              {byCategory.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>{c.value}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily trend */}
        <div className="card">
          <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 14 }}>DAILY TREND (MIN)</div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={byDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => [`${v} min`, 'Downtime']} contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="mins" stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Machine bar chart ───────────────────────────────────────────── */}
      <div className="card">
        <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 14 }}>DOWNTIME PER MACHINE (MIN)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byMachine} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={v => [`${v} min`, 'Downtime']} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {byMachine.map((_, i) => (
                <Cell key={i} fill={i === 0 ? 'var(--danger)' : i === 1 ? '#F97316' : ACCENT} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Pareto chart ────────────────────────────────────────────────── */}
      <div className="card">
        <div style={{ fontSize: 10, letterSpacing: 2, color: ACCENT, marginBottom: 4 }}>PARETO ANALYSIS — DOWNTIME CATEGORIES</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
          Bars = total minutes &nbsp;·&nbsp; Line = cumulative %
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={paretoData} margin={{ right: 36 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={48}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              formatter={(v, name) => name === 'cumPct' ? [`${v}%`, 'Cumulative'] : [`${v} min`, 'Downtime']}
              contentStyle={TOOLTIP_STYLE}
            />
            {/* 80% reference line */}
            <ReferenceLine
              yAxisId="right"
              y={80}
              stroke="#EF444466"
              strokeDasharray="6 3"
              label={{ value: '80%', fill: '#EF444488', fontSize: 10, position: 'insideTopRight' }}
            />
            <Bar yAxisId="left" dataKey="value" radius={[4, 4, 0, 0]} fill={ACCENT} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumPct"
              stroke="var(--danger)"
              strokeWidth={2}
              dot={{ fill: 'var(--danger)', r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
