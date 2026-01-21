import { useState, useCallback } from 'react'
import type { TabId } from '../types/tabs'

export function useTabs(defaultTab: TabId) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  const switchTab = useCallback((tabId: TabId) => {
    setActiveTab(tabId)
  }, [])

  return { activeTab, switchTab }
}
