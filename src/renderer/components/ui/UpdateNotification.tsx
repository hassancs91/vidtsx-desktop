import { useUpdater } from '../../hooks/useUpdater'

export function UpdateNotification() {
  const {
    status,
    info,
    progress,
    error,
    dismissed,
    downloadUpdate,
    installUpdate,
    dismiss
  } = useUpdater()

  // Don't show if dismissed or no update available
  if (dismissed || status === 'not-available' || status === 'checking') {
    return null
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="fixed top-4 right-4 z-50 bg-neo-coral border-2 border-black rounded-lg p-4 shadow-neo max-w-sm">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-black mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-black">Update Error</h4>
            <p className="text-sm text-black/80 break-words">{error}</p>
          </div>
          <button onClick={dismiss} className="text-black hover:opacity-70 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Update available
  if (status === 'available' && info) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-neo-teal border-2 border-black rounded-lg p-4 shadow-neo max-w-sm">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-black mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-black">Update Available</h4>
            <p className="text-sm text-black/80 mb-3">
              Version {info.version} is ready to download.
            </p>
            <div className="flex gap-2">
              <button
                onClick={downloadUpdate}
                className="px-3 py-1.5 bg-black text-white text-sm font-bold rounded border-2 border-black hover:bg-gray-800 transition-colors"
              >
                Download
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 bg-white text-black text-sm font-bold rounded border-2 border-black hover:bg-gray-100 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Downloading
  if (status === 'downloading' && progress) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-neo-yellow border-2 border-black rounded-lg p-4 shadow-neo max-w-sm">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-black mt-0.5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-black">Downloading Update</h4>
            <div className="mt-2">
              <div className="w-full bg-white border-2 border-black rounded-full h-3">
                <div
                  className="bg-black h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-xs text-black/80 mt-1">
                {Math.round(progress.percent)}% ({formatBytes(progress.transferred)} / {formatBytes(progress.total)})
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Downloaded - ready to install
  if (status === 'downloaded' && info) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-neo-purple border-2 border-black rounded-lg p-4 shadow-neo max-w-sm">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white">Update Ready</h4>
            <p className="text-sm text-white/90 mb-3">
              Version {info.version} is ready to install. The app will restart.
            </p>
            <div className="flex gap-2">
              <button
                onClick={installUpdate}
                className="px-3 py-1.5 bg-white text-black text-sm font-bold rounded border-2 border-black hover:bg-gray-100 transition-colors"
              >
                Install & Restart
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 bg-transparent text-white text-sm font-bold rounded border-2 border-white hover:bg-white/10 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
