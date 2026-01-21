import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'
import { BrowserWindow, app } from 'electron'
import type { UpdateState } from '../../shared/types'

class UpdaterService {
  private mainWindow: BrowserWindow | null = null

  constructor() {
    // Disable auto-download - we want manual control
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    this.setupEventListeners()
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  private sendStatusToWindow(state: UpdateState) {
    this.mainWindow?.webContents.send('updater:status', state)
  }

  private setupEventListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow({
        status: 'checking',
        info: null,
        progress: null,
        error: null
      })
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.sendStatusToWindow({
        status: 'available',
        info: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: typeof info.releaseNotes === 'string'
            ? info.releaseNotes
            : undefined
        },
        progress: null,
        error: null
      })
    })

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      this.sendStatusToWindow({
        status: 'not-available',
        info: {
          version: info.version
        },
        progress: null,
        error: null
      })
    })

    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
      this.sendStatusToWindow({
        status: 'downloading',
        info: null,
        progress: {
          bytesPerSecond: progressObj.bytesPerSecond,
          percent: progressObj.percent,
          transferred: progressObj.transferred,
          total: progressObj.total
        },
        error: null
      })
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.sendStatusToWindow({
        status: 'downloaded',
        info: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: typeof info.releaseNotes === 'string'
            ? info.releaseNotes
            : undefined
        },
        progress: null,
        error: null
      })
    })

    autoUpdater.on('error', (err: Error) => {
      this.sendStatusToWindow({
        status: 'error',
        info: null,
        progress: null,
        error: err.message
      })
    })
  }

  async checkForUpdates(): Promise<void> {
    // Skip update check in development
    if (!app.isPackaged) {
      this.sendStatusToWindow({
        status: 'not-available',
        info: { version: app.getVersion() },
        progress: null,
        error: null
      })
      return
    }

    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      this.sendStatusToWindow({
        status: 'error',
        info: null,
        progress: null,
        error: error instanceof Error ? error.message : 'Failed to check for updates'
      })
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      this.sendStatusToWindow({
        status: 'error',
        info: null,
        progress: null,
        error: error instanceof Error ? error.message : 'Failed to download update'
      })
    }
  }

  installUpdate(): void {
    autoUpdater.quitAndInstall(false, true)
  }
}

export const updaterService = new UpdaterService()
