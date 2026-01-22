import { contextBridge, ipcRenderer } from 'electron'
import type {
  RenderOptions,
  RenderProgress,
  ElectronAPI,
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
  DownloadProgress,
  WhisperModel,
  ExportFormat,
  TranscriberSettings,
  UpdateState
} from '../shared/types'

const electronAPI: ElectronAPI = {
  getVersion: () => ipcRenderer.invoke('get-version'),

  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  selectTsxFile: () => ipcRenderer.invoke('select-tsx-file'),

  selectOutputPath: (format: 'mp4' | 'mov') =>
    ipcRenderer.invoke('select-output-path', format),

  startRender: (options: RenderOptions) =>
    ipcRenderer.invoke('start-render', options),

  onRenderProgress: (callback: (progress: RenderProgress) => void) => {
    const listener = (_: unknown, progress: RenderProgress) => callback(progress)
    ipcRenderer.on('render-progress', listener)
    return () => {
      ipcRenderer.removeListener('render-progress', listener)
    }
  },

  cancelRender: () => ipcRenderer.invoke('cancel-render'),

  // Transcriber APIs
  transcriber: {
    selectMediaFile: () => ipcRenderer.invoke('transcriber:select-media-file'),

    getModelStatus: () => ipcRenderer.invoke('transcriber:get-model-status'),

    downloadModel: (model: WhisperModel) =>
      ipcRenderer.invoke('transcriber:download-model', model),

    onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
      const listener = (_: unknown, progress: DownloadProgress) => callback(progress)
      ipcRenderer.on('transcriber:download-progress', listener)
      return () => {
        ipcRenderer.removeListener('transcriber:download-progress', listener)
      }
    },

    cancelDownload: () => ipcRenderer.invoke('transcriber:cancel-download'),

    startTranscription: (options: TranscriptionOptions) =>
      ipcRenderer.invoke('transcriber:start', options),

    onTranscriptionProgress: (callback: (progress: TranscriptionProgress) => void) => {
      const listener = (_: unknown, progress: TranscriptionProgress) => callback(progress)
      ipcRenderer.on('transcriber:progress', listener)
      return () => {
        ipcRenderer.removeListener('transcriber:progress', listener)
      }
    },

    cancelTranscription: () => ipcRenderer.invoke('transcriber:cancel'),

    exportTranscription: (result: TranscriptionResult, format: ExportFormat) =>
      ipcRenderer.invoke('transcriber:export', result, format),

    getSettings: () => ipcRenderer.invoke('transcriber:get-settings'),

    saveSettings: (settings: Partial<TranscriberSettings>) =>
      ipcRenderer.invoke('transcriber:save-settings', settings)
  },

  // Updater APIs
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),

    downloadUpdate: () => ipcRenderer.invoke('updater:download'),

    installUpdate: () => ipcRenderer.invoke('updater:install'),

    onUpdateStatus: (callback: (state: UpdateState) => void) => {
      const listener = (_: unknown, state: UpdateState) => callback(state)
      ipcRenderer.on('updater:status', listener)
      return () => {
        ipcRenderer.removeListener('updater:status', listener)
      }
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
