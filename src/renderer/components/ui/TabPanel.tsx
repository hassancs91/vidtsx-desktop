import type { ReactNode } from 'react'
import type { TabId } from '../../types/tabs'

interface TabPanelProps {
  id: TabId
  activeTab: TabId
  children: ReactNode
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  const isActive = id === activeTab

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={`neo-tab-panel ${isActive ? 'neo-tab-panel-active' : ''}`}
    >
      {children}
    </div>
  )
}
