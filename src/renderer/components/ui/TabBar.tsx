import { TabButton } from './TabButton'
import type { Tab, TabId } from '../../types/tabs'

interface TabBarProps {
  tabs: Tab[]
  activeTab: TabId
  onTabChange: (id: TabId) => void
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="neo-tab-bar" role="tablist">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={onTabChange}
        />
      ))}
    </nav>
  )
}
