import { TabBar } from './components/ui/TabBar'
import { TabPanel } from './components/ui/TabPanel'
import { UpdateNotification } from './components/ui/UpdateNotification'
import { TsxRenderer } from './components/tools/TsxRenderer/TsxRenderer'
import { Transcriber } from './components/tools/Transcriber/Transcriber'
import { useTabs } from './hooks/useTabs'
import type { Tab } from './types/tabs'

const TABS: Tab[] = [
  {
    id: 'tsx-renderer',
    label: 'TSX Renderer',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    id: 'transcriber',
    label: 'Transcriber',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
    ),
  },
]

const SOCIAL_LINKS = {
  website: 'https://learnwithhasan.com',
  youtube: 'https://www.youtube.com/@hasanaboulhasan',
  linkedin: 'https://www.linkedin.com/in/h-educate/',
}

export default function App() {
  const { activeTab, switchTab } = useTabs('tsx-renderer')

  return (
    <div className="min-h-screen bg-neo-bg flex flex-col">
      {/* Update Notification */}
      <UpdateNotification />

      <div className="flex-1 p-6 pb-16">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-extrabold">VidTSX Desktop</h1>
            <span className="text-sm font-medium text-gray-500">v1.0</span>
          </div>
          <p className="text-sm text-gray-600">Local TSX Renderer & Tools</p>
          <button
            onClick={() => window.electronAPI.openExternal('https://vidtsx.com')}
            className="text-sm text-neo-primary hover:underline cursor-pointer"
          >
            vidtsx.com
          </button>
        </div>

        {/* Tab Navigation */}
        <TabBar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={switchTab}
        />

        {/* Tab Content */}
        <TabPanel id="tsx-renderer" activeTab={activeTab}>
          <TsxRenderer />
        </TabPanel>

        <TabPanel id="transcriber" activeTab={activeTab}>
          <Transcriber />
        </TabPanel>
      </div>

      {/* Status Bar Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-neo-bg border-t-2 border-black px-6 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">&copy; 2026 VidTSX v1.0. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Developer</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.electronAPI.openExternal(SOCIAL_LINKS.website)}
              className="text-black hover:text-neo-primary transition-colors cursor-pointer"
              title="Website"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </button>
            <button
              onClick={() => window.electronAPI.openExternal(SOCIAL_LINKS.youtube)}
              className="text-black hover:text-red-600 transition-colors cursor-pointer"
              title="YouTube"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </button>
            <button
              onClick={() => window.electronAPI.openExternal(SOCIAL_LINKS.linkedin)}
              className="text-black hover:text-blue-700 transition-colors cursor-pointer"
              title="LinkedIn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
