const TABS = [
  { id: 'record',    icon: '⊕', label: 'Record'    },
  { id: 'dashboard', icon: '◈', label: 'Dashboard' },
  { id: 'log',       icon: '≡', label: 'Log'       },
  { id: 'settings',  icon: '⚙', label: 'Settings'  },
]

export default function BottomNav({ tab, onTabChange, activeCount }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`nav-item ${tab === t.id ? 'active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          <span className="nav-icon">
            {t.icon}
            {t.id === 'record' && activeCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--danger)', color: '#fff',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: 9, fontWeight: 700,
                position: 'relative', top: -8, left: -4,
              }}>
                {activeCount}
              </span>
            )}
          </span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
