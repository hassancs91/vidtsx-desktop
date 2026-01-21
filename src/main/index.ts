import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'path'

// Set esbuild binary path BEFORE any @remotion imports (fixes packaged app ENOENT errors)
// Note: Remotion compositor binary is configured via binariesDirectory option in render.ts
if (app.isPackaged) {
  process.env.ESBUILD_BINARY_PATH = join(
    app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
    'node_modules',
    '@remotion',
    'bundler',
    'node_modules',
    'esbuild',
    'lib',
    'downloaded-@esbuild-win32-x64-esbuild.exe'
  )
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    icon: join(__dirname, '../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, 'preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#FFFDF0',
    titleBarStyle: 'default',
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Dynamic import AFTER env var is set
  const { registerIpcHandlers } = await import('./ipc')
  const { updaterService } = await import('./services/updater')

  registerIpcHandlers()
  createWindow()

  // Set main window for updater service and check for updates
  if (mainWindow) {
    updaterService.setMainWindow(mainWindow)

    // Check for updates after a short delay (allows UI to load)
    setTimeout(() => {
      updaterService.checkForUpdates()
    }, 3000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
