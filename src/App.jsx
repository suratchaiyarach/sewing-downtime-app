import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { SEED_RECORDS, DEFAULT_CONFIG, DEFAULT_SESSION_INFO, DEFAULT_LINE_CONFIG } from './constants'
import { today, nowTime } from './utils'

import Header          from './components/Header'
import BottomNav       from './components/BottomNav'
import RecordPanel     from './components/RecordPanel'
import EditRecordModal from './components/EditRecordModal'
import ShiftModal      from './components/ShiftModal'

import RecordTab    from './components/tabs/RecordTab'
import DashboardTab from './components/tabs/DashboardTab'
import LogTab       from './components/tabs/LogTab'
import SettingsTab  from './components/tabs/SettingsTab'

// ── Line-scoped config helpers ────────────────────────────────────────────────
function getLineConfig(cfg, lineName) {
  return cfg.lines?.[lineName] ?? DEFAULT_LINE_CONFIG
}

function setLineConfig(cfg, lineName, updater) {
  return {
    ...cfg,
    lines: {
      ...cfg.lines,
      [lineName]: updater(getLineConfig(cfg, lineName)),
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Persisted state ───────────────────────────────────────────────────────
  const [records,     setRecords]     = useLocalStorage('dt_records',  SEED_RECORDS)
  const [config,      setConfig]      = useLocalStorage('dt_config',   DEFAULT_CONFIG)
  const [sessionInfo, setSessionInfo] = useLocalStorage('dt_session',  DEFAULT_SESSION_INFO)

  // ── Ephemeral state ───────────────────────────────────────────────────────
  const [tab,             setTab]             = useState('record')
  const [activeSessions,  setActiveSessions]  = useState({})
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [editRecord,      setEditRecord]      = useState(null)
  const [showShiftModal,  setShowShiftModal]  = useState(false)
  const [savedFlash,      setSavedFlash]      = useState(null)

  // ── Migrate old flat config format to line-scoped format ──────────────────
  useEffect(() => {
    if (config && !config.lines) {
      setConfig({
        lines: {
          [sessionInfo.lineName]: {
            machines:    config.machines    ?? DEFAULT_LINE_CONFIG.machines,
            operators:   config.operators   ?? DEFAULT_LINE_CONFIG.operators,
            assignments: config.assignments ?? DEFAULT_LINE_CONFIG.assignments,
          },
        },
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const stopTimer = useCallback((machineId, { category, notes }) => {
    const s = activeSessions[machineId]
    if (!s) return
    const duration = Math.max(1, Math.round(s.elapsed / 60))
    const record = {
      id:          Date.now(),
      date:        today(),
      machine:     machineId,
      operator:    s.operator,
      operation:   s.operation || '—',
      category:    category || 'Other',
      startTime:   s.startTime,
      endTime:     nowTime(),
      duration,
      notes:       notes || '',
      shift:       sessionInfo.shift,
      lineName:    sessionInfo.lineName,
      styleNumber: sessionInfo.styleNumber,
    }
    setRecords(r => [record, ...r])
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
  const updateRecord = useCallback((id, updates) => {
    setRecords(r => r.map(rec => rec.id === id ? { ...rec, ...updates } : rec))
    setEditRecord(null)
  }, [])

  const deleteRecord = useCallback((id) => {
    setRecords(r => r.filter(rec => rec.id !== id))
    setEditRecord(null)
  }, [])

  // ── Line management ───────────────────────────────────────────────────────
  const changeLine = useCallback((name) => {
    setSessionInfo(s => ({ ...s, lineName: name }))
  }, [])

  const addLine = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setConfig(c => {
      if (c.lines?.[trimmed]) return c   // already exists
      return { ...c, lines: { ...c.lines, [trimmed]: { ...DEFAULT_LINE_CONFIG } } }
    })
  }, [])

  const removeLine = useCallback((name) => {
    setConfig(c => {
      const { [name]: _, ...rest } = c.lines || {}
      return { ...c, lines: rest }
    })
    // Switch away from deleted line
    if (sessionInfo.lineName === name) {
      const remaining = Object.keys(config.lines || {}).filter(l => l !== name)
      if (remaining.length > 0) setSessionInfo(s => ({ ...s, lineName: remaining[0] }))
    }
  }, [sessionInfo.lineName, config.lines])

  // ── Config management (line-scoped) ───────────────────────────────────────
  const ln = sessionInfo.lineName

  const addMachine = useCallback((id) => {
    setConfig(c => {
      const lc = getLineConfig(c, ln)
      if (lc.machines.find(m => m.id === id)) return c
      return setLineConfig(c, ln, l => ({ ...l, machines: [...l.machines, { id, enabled: true }] }))
    })
  }, [ln])

  const updateMachine = useCallback((id, updates) => {
    setConfig(c => setLineConfig(c, ln, l => ({
      ...l, machines: l.machines.map(m => m.id === id ? { ...m, ...updates } : m),
    })))
  }, [ln])

  const removeMachine = useCallback((id) => {
    setConfig(c => setLineConfig(c, ln, l => ({
      ...l, machines: l.machines.filter(m => m.id !== id),
    })))
  }, [ln])

  const addOperator = useCallback((name) => {
    const id = `op-${Date.now()}`
    setConfig(c => setLineConfig(c, ln, l => ({
      ...l, operators: [...l.operators, { id, name }],
    })))
  }, [ln])

  const updateOperator = useCallback((id, name) => {
    setConfig(c => setLineConfig(c, ln, l => ({
      ...l, operators: l.operators.map(op => op.id === id ? { ...op, name } : op),
    })))
  }, [ln])

  const removeOperator = useCallback((id) => {
    setConfig(c => setLineConfig(c, ln, l => ({
      ...l, operators: l.operators.filter(op => op.id !== id),
    })))
  }, [ln])

  const updateAssignment = useCallback((machineId, operatorName) => {
    setConfig(c => setLineConfig(c, ln, l => ({
      ...l, assignments: { ...l.assignments, [machineId]: operatorName },
    })))
  }, [ln])

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

  return (
    <div className="app">
      <Header
        sessionInfo={sessionInfo}
        lineNames={lineNames}
        activeCount={activeCount}
        onChangeLine={changeLine}
        onEditShift={() => setShowShiftModal(true)}
        onExportCSV={exportCSV}
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
