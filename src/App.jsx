import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { supabase } from './lib/supabase'
import { DEFAULT_SESSION_INFO, DEFAULT_LINE_CONFIG } from './constants'
import { today, nowTime } from './utils'

import Header          from './components/Header'
import BottomNav       from './components/BottomNav'
import RecordPanel     from './components/RecordPanel'
import EditRecordModal from './components/EditRecordModal'
import ShiftModal      from './components/ShiftModal'
import LoginScreen     from './components/LoginScreen'

import RecordTab    from './components/tabs/RecordTab'
import DashboardTab from './components/tabs/DashboardTab'
import LogTab       from './components/tabs/LogTab'
import SettingsTab  from './components/tabs/SettingsTab'

// ── Line-scoped config helpers ────────────────────────────────────────────────
function getLineConfig(cfg, lineName) {
  return cfg.lines?.[lineName] ?? DEFAULT_LINE_CONFIG
}

// Convert array of line_configs rows → { lines: { [lineName]: {...} } }
function rowsToConfig(rows) {
  const lines = {}
  rows.forEach(r => {
    lines[r.line_name] = {
      machines:    r.machines    ?? DEFAULT_LINE_CONFIG.machines,
      operators:   r.operators   ?? DEFAULT_LINE_CONFIG.operators,
      assignments: r.assignments ?? DEFAULT_LINE_CONFIG.assignments,
    }
  })
  return { lines }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth state ────────────────────────────────────────────────────────────
  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // ── Session info stays in localStorage (per-device UI state) ─────────────
  const [sessionInfo, setSessionInfo] = useLocalStorage('dt_session', DEFAULT_SESSION_INFO)

  // ── Supabase-backed state ─────────────────────────────────────────────────
  const [records, setRecords] = useState([])
  const [config,  setConfig]  = useState({ lines: {} })
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(null)

  // ── Ephemeral state ───────────────────────────────────────────────────────
  const [tab,             setTab]             = useState('record')
  const [activeSessions,  setActiveSessions]  = useState({})
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [editRecord,      setEditRecord]      = useState(null)
  const [showShiftModal,  setShowShiftModal]  = useState(false)
  const [savedFlash,      setSavedFlash]      = useState(null)

  // ── Auth: check session on mount + listen for changes ────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load data from Supabase (only when logged in) ─────────────────────────
  useEffect(() => {
    if (!user) return
    async function loadAll() {
      setLoading(true)
      try {
        const [recRes, cfgRes] = await Promise.all([
          supabase.from('records').select('*').order('id', { ascending: false }),
          supabase.from('line_configs').select('*'),
        ])
        if (recRes.error) throw recRes.error
        if (cfgRes.error) throw cfgRes.error

        // Map snake_case DB columns → camelCase app fields
        setRecords(recRes.data.map(r => ({
          id:          r.id,
          date:        r.date,
          machine:     r.machine,
          operator:    r.operator,
          operation:   r.operation,
          category:    r.category,
          startTime:   r.start_time,
          endTime:     r.end_time,
          duration:    r.duration,
          notes:       r.notes,
          shift:       r.shift,
          lineName:    r.line_name,
          styleNumber: r.style_number,
        })))

        const cfg = rowsToConfig(cfgRes.data)
        setConfig(cfg)

        // If current line no longer exists, switch to first available
        if (cfgRes.data.length > 0 && !cfg.lines[sessionInfo.lineName]) {
          setSessionInfo(s => ({ ...s, lineName: cfgRes.data[0].line_name }))
        }
      } catch (err) {
        console.error('Supabase load error:', err)
        setDbError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helper: upsert a line config row to Supabase ─────────────────────────
  const upsertLineConfig = useCallback(async (lineName, lineConfig) => {
    const { error } = await supabase.from('line_configs').upsert({
      line_name:   lineName,
      machines:    lineConfig.machines,
      operators:   lineConfig.operators,
      assignments: lineConfig.assignments,
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'line_name' })
    if (error) console.error('upsert line_config error:', error)
  }, [])

  // ── Live timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setActiveSessions(prev => {
        const next = {}
        let changed = false
        Object.entries(prev).forEach(([id, s]) => {
          const elapsed = Math.floor((Date.now() - s.startTs) / 1000)
          next[id] = elapsed !== s.elapsed ? ((changed = true), { ...s, elapsed }) : s
        })
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // ── Machine panel ─────────────────────────────────────────────────────────
  const openMachine = useCallback((id) => setSelectedMachine(id), [])
  const closePanel  = useCallback(() => setSelectedMachine(null), [])

  // ── Session control ───────────────────────────────────────────────────────
  const startTimer = useCallback((machineId, { operator, operation }) => {
    setActiveSessions(p => ({
      ...p,
      [machineId]: {
        startTime: nowTime(),
        startTs:   Date.now(),
        elapsed:   0,
        operator,
        operation,
        category: '',
        notes:    '',
      },
    }))
    setSelectedMachine(null)
  }, [])

  const updateSession = useCallback((machineId, updates) => {
    setActiveSessions(p => ({ ...p, [machineId]: { ...p[machineId], ...updates } }))
  }, [])

  const stopTimer = useCallback(async (machineId, { category, notes }) => {
    const s = activeSessions[machineId]
    if (!s) return
    const duration = Math.max(1, Math.round(s.elapsed / 60))
    const record = {
      id:           Date.now(),
      date:         today(),
      machine:      machineId,
      operator:     s.operator,
      operation:    s.operation || '—',
      category:     category || 'Other',
      start_time:   s.startTime,
      end_time:     nowTime(),
      duration,
      notes:        notes || '',
      shift:        sessionInfo.shift,
      line_name:    sessionInfo.lineName,
      style_number: sessionInfo.styleNumber,
    }
    // Insert to Supabase
    const { data, error } = await supabase.from('records').insert(record).select().single()
    if (error) {
      console.error('insert record error:', error)
    } else {
      // Add camelCase version to local state
      setRecords(r => [{
        id:          data.id,
        date:        data.date,
        machine:     data.machine,
        operator:    data.operator,
        operation:   data.operation,
        category:    data.category,
        startTime:   data.start_time,
        endTime:     data.end_time,
        duration:    data.duration,
        notes:       data.notes,
        shift:       data.shift,
        lineName:    data.line_name,
        styleNumber: data.style_number,
      }, ...r])
    }
    setActiveSessions(p => { const n = { ...p }; delete n[machineId]; return n })
    setSavedFlash(machineId)
    setTimeout(() => setSavedFlash(null), 2200)
    setSelectedMachine(null)
  }, [activeSessions, sessionInfo])

  const cancelTimer = useCallback((machineId) => {
    setActiveSessions(p => { const n = { ...p }; delete n[machineId]; return n })
    setSelectedMachine(null)
  }, [])

  // ── Record management ─────────────────────────────────────────────────────
  const updateRecord = useCallback(async (id, updates) => {
    const dbUpdates = {
      machine:      updates.machine,
      operator:     updates.operator,
      operation:    updates.operation,
      category:     updates.category,
      start_time:   updates.startTime,
      end_time:     updates.endTime,
      duration:     updates.duration,
      notes:        updates.notes,
      shift:        updates.shift,
      line_name:    updates.lineName,
      style_number: updates.styleNumber,
    }
    // Remove undefined keys
    Object.keys(dbUpdates).forEach(k => dbUpdates[k] === undefined && delete dbUpdates[k])
    const { error } = await supabase.from('records').update(dbUpdates).eq('id', id)
    if (error) { console.error('update record error:', error); return }
    setRecords(r => r.map(rec => rec.id === id ? { ...rec, ...updates } : rec))
    setEditRecord(null)
  }, [])

  const deleteRecord = useCallback(async (id) => {
    const { error } = await supabase.from('records').delete().eq('id', id)
    if (error) { console.error('delete record error:', error); return }
    setRecords(r => r.filter(rec => rec.id !== id))
    setEditRecord(null)
  }, [])

  // ── Line management ───────────────────────────────────────────────────────
  const changeLine = useCallback((name) => {
    setSessionInfo(s => ({ ...s, lineName: name }))
  }, [])

  const addLine = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed || config.lines?.[trimmed]) return
    const newLineConfig = { ...DEFAULT_LINE_CONFIG }
    const { error } = await supabase.from('line_configs').insert({
      line_name:   trimmed,
      machines:    newLineConfig.machines,
      operators:   newLineConfig.operators,
      assignments: newLineConfig.assignments,
    })
    if (error) { console.error('addLine error:', error); return }
    setConfig(c => ({
      ...c,
      lines: { ...c.lines, [trimmed]: newLineConfig },
    }))
  }, [config.lines])

  const removeLine = useCallback(async (name) => {
    const { error } = await supabase.from('line_configs').delete().eq('line_name', name)
    if (error) { console.error('removeLine error:', error); return }
    setConfig(c => {
      const { [name]: _, ...rest } = c.lines || {}
      return { ...c, lines: rest }
    })
    if (sessionInfo.lineName === name) {
      const remaining = Object.keys(config.lines || {}).filter(l => l !== name)
      if (remaining.length > 0) setSessionInfo(s => ({ ...s, lineName: remaining[0] }))
    }
  }, [sessionInfo.lineName, config.lines])

  // ── Config management (line-scoped) ───────────────────────────────────────
  const ln = sessionInfo.lineName

  const addMachine = useCallback(async (id) => {
    const lc = getLineConfig(config, ln)
    if (lc.machines.find(m => m.id === id)) return
    const updated = { ...lc, machines: [...lc.machines, { id, enabled: true }] }
    setConfig(c => ({ ...c, lines: { ...c.lines, [ln]: updated } }))
    await upsertLineConfig(ln, updated)
  }, [config, ln, upsertLineConfig])

  const updateMachine = useCallback(async (id, updates) => {
    const lc = getLineConfig(config, ln)
    const updated = { ...lc, machines: lc.machines.map(m => m.id === id ? { ...m, ...updates } : m) }
    setConfig(c => ({ ...c, lines: { ...c.lines, [ln]: updated } }))
    await upsertLineConfig(ln, updated)
  }, [config, ln, upsertLineConfig])

  const removeMachine = useCallback(async (id) => {
    const lc = getLineConfig(config, ln)
    const updated = { ...lc, machines: lc.machines.filter(m => m.id !== id) }
    setConfig(c => ({ ...c, lines: { ...c.lines, [ln]: updated } }))
    await upsertLineConfig(ln, updated)
  }, [config, ln, upsertLineConfig])

  const addOperator = useCallback(async (name) => {
    const lc = getLineConfig(config, ln)
    const newOp = { id: `op-${Date.now()}`, name }
    const updated = { ...lc, operators: [...lc.operators, newOp] }
    setConfig(c => ({ ...c, lines: { ...c.lines, [ln]: updated } }))
    await upsertLineConfig(ln, updated)
  }, [config, ln, upsertLineConfig])

  const updateOperator = useCallback(async (id, name) => {
    const lc = getLineConfig(config, ln)
    const updated = { ...lc, operators: lc.operators.map(op => op.id === id ? { ...op, name } : op) }
    setConfig(c => ({ ...c, lines: { ...c.lines, [ln]: updated } }))
    await upsertLineConfig(ln, updated)
  }, [config, ln, upsertLineConfig])

  const removeOperator = useCallback(async (id) => {
    const lc = getLineConfig(config, ln)
    const updated = { ...lc, operators: lc.operators.filter(op => op.id !== id) }
    setConfig(c => ({ ...c, lines: { ...c.lines, [ln]: updated } }))
    await upsertLineConfig(ln, updated)
  }, [config, ln, upsertLineConfig])

  const updateAssignment = useCallback(async (machineId, operatorName) => {
    const lc = getLineConfig(config, ln)
    const updated = { ...lc, assignments: { ...lc.assignments, [machineId]: operatorName } }
    setConfig(c => ({ ...c, lines: { ...c.lines, [ln]: updated } }))
    await upsertLineConfig(ln, updated)
  }, [config, ln, upsertLineConfig])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setRecords([])
    setConfig({ lines: {} })
  }, [])

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const h = ['ID','Date','Machine','Operator','Operation','Category','Start','End','Duration (min)','Shift','Line','Style','Notes']
    const rows = records.map(r => [
      r.id, r.date, r.machine, r.operator, r.operation, r.category,
      r.startTime, r.endTime, r.duration,
      r.shift || '', r.lineName || '', r.styleNumber || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ].join(','))
    const csv = [h.join(','), ...rows].join('\n')
    const a   = document.createElement('a')
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `downtime_${today()}.csv`
    a.click()
  }, [records])

  // ── Derived ───────────────────────────────────────────────────────────────
  const lineNames         = useMemo(() => Object.keys(config.lines || {}), [config.lines])
  const currentLineConfig = getLineConfig(config, sessionInfo.lineName)
  const enabledMachines   = currentLineConfig.machines.filter(m => m.enabled)
  const activeCount       = Object.keys(activeSessions).length

  // ── Auth / loading / error screens ───────────────────────────────────────
  if (authLoading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16, background:'var(--bg)', color:'var(--text)' }}>
      <div style={{ fontSize:40 }}>⏳</div>
      <div style={{ fontSize:18, fontWeight:600 }}>Loading…</div>
    </div>
  )

  if (!user) return <LoginScreen />

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16, background:'var(--bg)', color:'var(--text)' }}>
      <div style={{ fontSize:40 }}>⏳</div>
      <div style={{ fontSize:18, fontWeight:600 }}>Connecting to database…</div>
    </div>
  )

  if (dbError) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16, background:'var(--bg)', color:'var(--text)', padding:24 }}>
      <div style={{ fontSize:40 }}>❌</div>
      <div style={{ fontSize:18, fontWeight:600, textAlign:'center' }}>Database connection failed</div>
      <div style={{ fontSize:13, color:'var(--muted)', textAlign:'center', maxWidth:320 }}>{dbError}</div>
      <div style={{ fontSize:13, color:'var(--muted)', textAlign:'center', maxWidth:320 }}>Check your <code>.env</code> file has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</div>
    </div>
  )

  return (
    <div className="app">
      <Header
        sessionInfo={sessionInfo}
        lineNames={lineNames}
        activeCount={activeCount}
        onChangeLine={changeLine}
        onEditShift={() => setShowShiftModal(true)}
        onExportCSV={exportCSV}
        onLogout={logout}
      />

      <main className="main-content">
        {tab === 'record' && (
          <RecordTab
            machines={enabledMachines}
            assignments={currentLineConfig.assignments}
            activeSessions={activeSessions}
            savedFlash={savedFlash}
            onSelectMachine={openMachine}
          />
        )}
        {tab === 'dashboard' && (
          <DashboardTab
            records={records}
            lineName={sessionInfo.lineName}
          />
        )}
        {tab === 'log' && (
          <LogTab
            records={records}
            machines={enabledMachines}
            onEdit={setEditRecord}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab
            lineConfig={currentLineConfig}
            lineName={sessionInfo.lineName}
            lineNames={lineNames}
            records={records}
            onAddLine={addLine}
            onRemoveLine={removeLine}
            onAddMachine={addMachine}
            onUpdateMachine={updateMachine}
            onRemoveMachine={removeMachine}
            onAddOperator={addOperator}
            onUpdateOperator={updateOperator}
            onRemoveOperator={removeOperator}
            onUpdateAssignment={updateAssignment}
          />
        )}
      </main>

      <BottomNav tab={tab} onTabChange={setTab} activeCount={activeCount} />

      {selectedMachine && (
        <RecordPanel
          machineId={selectedMachine}
          session={activeSessions[selectedMachine]}
          defaultOperator={currentLineConfig.assignments[selectedMachine] || ''}
          operators={currentLineConfig.operators}
          onStart={startTimer}
          onUpdate={updateSession}
          onStop={stopTimer}
          onCancel={cancelTimer}
          onClose={closePanel}
        />
      )}

      {editRecord && (
        <EditRecordModal
          record={editRecord}
          machines={enabledMachines}
          operators={currentLineConfig.operators}
          onSave={updateRecord}
          onDelete={deleteRecord}
          onClose={() => setEditRecord(null)}
        />
      )}

      {showShiftModal && (
        <ShiftModal
          sessionInfo={sessionInfo}
          onSave={setSessionInfo}
          onClose={() => setShowShiftModal(false)}
        />
      )}
    </div>
  )
}
