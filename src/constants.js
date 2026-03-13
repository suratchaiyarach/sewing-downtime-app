export const ACCENT = '#F59E0B'

export const CHART_COLORS = [
  '#F59E0B','#EF4444','#3B82F6','#10B981','#8B5CF6',
  '#F97316','#EC4899','#06B6D4','#84CC16','#6366F1',
  '#14B8A6','#F43F5E',
]

export const DOWNTIME_CATEGORIES = [
  { label: 'Thread Breakage',       icon: '🧵' },
  { label: 'Needle Break / Change', icon: '📍' },
  { label: 'Mechanical Breakdown',  icon: '⚙️' },
  { label: 'Electrical Fault',      icon: '⚡' },
  { label: 'Fabric Jam',            icon: '🪡' },
  { label: 'Machine Adjustment',    icon: '🔧' },
  { label: 'Operator Absence',      icon: '🚶' },
  { label: 'Quality / Rework',      icon: '🔍' },
  { label: 'Preventive Maint.',     icon: '🛠️' },
  { label: 'Material Shortage',     icon: '📦' },
  { label: 'Power Failure',         icon: '🔌' },
  { label: 'Other',                 icon: '❓' },
]

export const OPERATIONS = [
  'Collar Attach','Sleeve Set','Side Seam','Hem Stitch','Zipper Attach',
  'Pocket Welt','Button Hole','Waistband','Cuff Attach','Lining Stitch',
  'Bartack','Label Sew','Overlock','Flat Seam','Top Stitch',
]

export const SHIFTS = ['Morning', 'Afternoon', 'OT']

const DEFAULT_OPERATOR_NAMES = [
  'Malee C.','Somchai P.','Somjai K.','Nipa T.','Chalerm B.',
  'Wanpen S.','Niran P.','Duangjai R.','Prasert L.','Arunee W.',
  'Boonmee K.','Wanida S.','Sumalee T.','Kamon P.','Preeda T.',
  'Siriporn C.','Narong K.','Pensri A.','Thida P.','Montri S.',
  'Ratana J.','Sunee P.','Vichai T.','Amporn K.','Dusit W.',
  'Kannika S.','Pairat C.','Ratchada N.','Somsak L.','Uraiwan B.',
]

export const DEFAULT_OPERATORS = DEFAULT_OPERATOR_NAMES.map((name, i) => ({
  id: `op-${i}`,
  name,
}))

const MACHINE_IDS = Array.from({ length: 20 }, (_, i) => `M-${String(i + 1).padStart(2, '0')}`)

export const DEFAULT_MACHINES = MACHINE_IDS.map(id => ({ id, enabled: true }))

const ASSIGNMENT_MAP = {
  'M-01':'Malee C.','M-02':'Somchai P.','M-03':'Somjai K.','M-04':'Nipa T.',
  'M-05':'Chalerm B.','M-06':'Wanpen S.','M-07':'Niran P.','M-08':'Duangjai R.',
  'M-09':'Prasert L.','M-10':'Arunee W.','M-11':'Boonmee K.','M-12':'Wanida S.',
  'M-13':'Sumalee T.','M-14':'Kamon P.','M-15':'Preeda T.','M-16':'Siriporn C.',
  'M-17':'Narong K.','M-18':'Pensri A.','M-19':'Thida P.','M-20':'Montri S.',
}

export const DEFAULT_LINE_CONFIG = {
  machines:    DEFAULT_MACHINES,
  operators:   DEFAULT_OPERATORS,
  assignments: ASSIGNMENT_MAP,
}

export const DEFAULT_CONFIG = {
  lines: {
    'Sewing Line 1': DEFAULT_LINE_CONFIG,
  },
}

export const DEFAULT_SESSION_INFO = {
  lineName:    'Sewing Line 1',
  shift:       'Morning',
  styleNumber: '',
}

export const SEED_RECORDS = [
  { id:1, date:'2026-03-09', machine:'M-03', operator:'Somjai K.', operation:'Collar Attach', category:'Thread Breakage',     startTime:'08:15', endTime:'08:32', duration:17, notes:'',                shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:2, date:'2026-03-09', machine:'M-07', operator:'Niran P.',  operation:'Side Seam',     category:'Mechanical Breakdown', startTime:'09:45', endTime:'10:20', duration:35, notes:'Feed dog replaced', shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:3, date:'2026-03-09', machine:'M-12', operator:'Wanida S.', operation:'Hem Stitch',    category:'Needle Break / Change',startTime:'11:00', endTime:'11:08', duration:8,  notes:'',                shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:4, date:'2026-03-10', machine:'M-03', operator:'Somjai K.', operation:'Collar Attach', category:'Machine Adjustment',   startTime:'08:00', endTime:'08:25', duration:25, notes:'Tension reset',    shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:5, date:'2026-03-10', machine:'M-15', operator:'Preeda T.', operation:'Zipper Attach', category:'Fabric Jam',           startTime:'13:10', endTime:'13:28', duration:18, notes:'',                shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:6, date:'2026-03-10', machine:'M-07', operator:'Niran P.',  operation:'Side Seam',     category:'Thread Breakage',      startTime:'14:05', endTime:'14:12', duration:7,  notes:'',                shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:7, date:'2026-03-11', machine:'M-01', operator:'Malee C.',  operation:'Sleeve Set',    category:'Electrical Fault',     startTime:'07:30', endTime:'08:15', duration:45, notes:'Motor relay fixed', shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:8, date:'2026-03-11', machine:'M-12', operator:'Wanida S.', operation:'Hem Stitch',    category:'Operator Absence',     startTime:'10:00', endTime:'10:40', duration:40, notes:'Late arrival',     shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:9, date:'2026-03-11', machine:'M-07', operator:'Niran P.',  operation:'Side Seam',     category:'Mechanical Breakdown', startTime:'11:30', endTime:'12:10', duration:40, notes:'Presser foot',     shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
  { id:10,date:'2026-03-11', machine:'M-05', operator:'Chalerm B.',operation:'Pocket Welt',   category:'Quality / Rework',     startTime:'14:00', endTime:'14:22', duration:22, notes:'Seam inspection',  shift:'Morning', lineName:'Sewing Line 1', styleNumber:'' },
]
