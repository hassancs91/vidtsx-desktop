import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { writeFileSync } from 'fs'
import { RenderService } from './services/render'
import { transcriberService } from './services/transcriber'
import { whisperLocalService } from './services/whisper-local'
import { settingsService } from './services/settings'
import { updaterService } from './services/updater'
import type {
  RenderOptions,
  TranscriptionOptions,
  WhisperModel,
  ExportFormat,
  TranscriptionResult
} from '../shared/types'

const renderService = new RenderService()

export function registerIpcHandlers() {
  // Open external URL in default browser
  ipcMain.handle('open-external', async (_, url: string) => {
    await shell.openExternal(url)
  })

  // Select TSX file
  ipcMain.handle('select-tsx-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select TSX Composition',
      filters: [
        { name: 'TSX Files', extensions: ['tsx'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  // Select output path
  ipcMain.handle('select-output-path', async (_, format: 'mp4' | 'mov') => {
    const ext = format === 'mp4' ? 'mp4' : 'mov'
    const result = await dialog.showSaveDialog({
      title: 'Save Video',
      defaultPath: `composition.${ext}`,
      filters: [
        { name: format.toUpperCase(), extensions: [ext] }
      ]
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    return result.filePath
  })

  // Start render
  ipcMain.handle('start-render', async (event, options: RenderOptions) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    try {
      await renderService.render(options, (progress) => {
        win?.webContents.send('render-progress', progress)
      })
    } catch (error) {
      win?.webContents.send('render-progress', {
        phase: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Render failed'
      })
      throw error
    }
  })

  // Cancel render
  ipcMain.handle('cancel-render', async () => {
    renderService.cancel()
  })

  // ============ Transcriber Handlers ============

  // Select media file
  ipcMain.handle('transcriber:select-media-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Audio/Video File',
      filters: [
        { name: 'Media Files', extensions: ['mp3', 'wav', 'mp4', 'mov', 'm4a', 'ogg', 'flac', 'webm', 'avi', 'mkv'] }
      ],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Get model status
  ipcMain.handle('transcriber:get-model-status', async () => {
    return whisperLocalService.getModelStatus()
  })

  // Download model
  ipcMain.handle('transcriber:download-model', async (event, model: WhisperModel) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    await whisperLocalService.downloadModel(model, (progress) => {
      win?.webContents.send('transcriber:download-progress', progress)
    })
  })

  // Cancel download
  ipcMain.handle('transcriber:cancel-download', async () => {
    whisperLocalService.cancelDownload()
  })

  // Start transcription
  ipcMain.handle('transcriber:start', async (event, options: TranscriptionOptions) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    try {
      win?.webContents.send('transcriber:progress', {
        phase: 'preparing',
        progress: 0,
        message: 'Preparing transcription...'
      })

      const result = await transcriberService.transcribe(options, (progress, message) => {
        win?.webContents.send('transcriber:progress', {
          phase: 'transcribing',
          progress,
          message
        })
      })

      win?.webContents.send('transcriber:progress', {
        phase: 'complete',
        progress: 100,
        message: 'Transcription complete!'
      })

      return result
    } catch (error) {
      win?.webContents.send('transcriber:progress', {
        phase: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Transcription failed'
      })
      throw error
    }
  })

  // Cancel transcription
  ipcMain.handle('transcriber:cancel', async () => {
    whisperLocalService.cancelTranscription()
  })

  // Export transcription
  ipcMain.handle('transcriber:export', async (_, result: TranscriptionResult, format: ExportFormat) => {
    const extensions: Record<ExportFormat, string> = {
      srt: 'srt',
      vtt: 'vtt',
      txt: 'txt',
      json: 'json'
    }

    const saveResult = await dialog.showSaveDialog({
      title: 'Export Transcription',
      defaultPath: `transcription.${extensions[format]}`,
      filters: [
        { name: format.toUpperCase(), extensions: [extensions[format]] }
      ]
    })

    if (saveResult.canceled || !saveResult.filePath) return

    const content = transcriberService.exportTranscription(result, format)
    writeFileSync(saveResult.filePath, content, 'utf-8')
  })

  // Get settings
  ipcMain.handle('transcriber:get-settings', async () => {
    return settingsService.getTranscriberSettings()
  })

  // Save settings
  ipcMain.handle('transcriber:save-settings', async (_, settings) => {
    settingsService.saveTranscriberSettings(settings)
  })

  // ============ Updater Handlers ============

  // Check for updates
  ipcMain.handle('updater:check', async () => {
    await updaterService.checkForUpdates()
  })

  // Download update
  ipcMain.handle('updater:download', async () => {
    await updaterService.downloadUpdate()
  })

  // Install update (quit and install)
  ipcMain.handle('updater:install', () => {
    updaterService.installUpdate()
  })
}
