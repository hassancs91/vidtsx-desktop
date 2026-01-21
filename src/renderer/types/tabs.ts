import type { ReactNode } from 'react'

export type TabId = 'tsx-renderer' | 'transcriber'

export interface Tab {
  id: TabId
  label: string
  icon?: ReactNode
  disabled?: boolean
  badge?: string
}
