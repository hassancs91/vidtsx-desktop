import type { Tab, TabId } from '../../types/tabs'

interface TabButtonProps {
  tab: Tab
  isActive: boolean
  onClick: (id: TabId) => void
}

export function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  return (
    <button
      className={`neo-tab ${isActive ? 'neo-tab-active' : ''} ${tab.disabled ? 'neo-tab-disabled' : ''}`}
      onClick={() => !tab.disabled && onClick(tab.id)}
      disabled={tab.disabled}
      aria-selected={isActive}
      role="tab"
    >
      {tab.icon && <span className="neo-tab-icon">{tab.icon}</span>}
      <span className="neo-tab-label">{tab.label}</span>
      {tab.badge && (
        <span className="neo-tab-badge">{tab.badge}</span>
      )}
    </button>
  )
}
