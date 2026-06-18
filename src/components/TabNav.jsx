export default function TabNav({ tabs, active, onChange }) {
  return (
    <nav className="tab-nav">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`tab-nav__btn ${active === t.key ? 'tab-nav__btn--active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <span className="tab-nav__icon">{t.icon}</span>
          <span className="tab-nav__label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
