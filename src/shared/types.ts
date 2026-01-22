// ============ Render Types ============

export interface RenderOptions {
  tsxPath: string
  outputPath: string
  format: 'mp4' | 'mov'
}

export interface RenderProgress {
  phase: 'bundling' | 'rendering' | 'complete' | 'error'
  progress: number
  message?: string
}

export interface CompositionConfig {
  id: string
  width: number
  height: number
  fps: number
  durationInFrames: number
}

// ============ Transcriber Types ============

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large'

export type TranscriptionMethod = 'local'

export type ExportFormat = 'srt' | 'vtt' | 'txt' | 'json'

export interface ModelStatus {
  model: WhisperModel
  available: boolean
  size: string
  downloading: boolean
  downloadProgress: number
}

export interface TranscriptionSegment {
  id: number
  start: number
  end: number
  text: string
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[]
  language: string
  duration: number
}

export interface TranscriptionProgress {
  phase: 'preparing' | 'transcribing' | 'complete' | 'error'
  progress: number
  message?: string
}

export interface DownloadProgress {
  model: WhisperModel
  progress: number
  downloaded: number
  total: number
}

export interface TranscriberSettings {
  method: TranscriptionMethod
  selectedModel: WhisperModel
}

export interface TranscriptionOptions {
  filePath: string
  method: TranscriptionMethod
  model?: WhisperModel
  language?: string
}

// ============ Auto-Update Types ============

export type UpdateStatus =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

export interface UpdateState {
  status: UpdateStatus
  info: UpdateInfo | null
  progress: UpdateProgress | null
  error: string | null
}

export interface UpdaterAPI {
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => void
  onUpdateStatus: (callback: (state: UpdateState) => void) => () => void
}

// ============ Electron API ============

export interface TranscriberAPI {
  selectMediaFile: () => Promise<string | null>
  getModelStatus: () => Promise<ModelStatus[]>
  downloadModel: (model: WhisperModel) => Promise<void>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
  cancelDownload: () => Promise<void>
  startTranscription: (options: TranscriptionOptions) => Promise<TranscriptionResult>
  onTranscriptionProgress: (callback: (progress: TranscriptionProgress) => void) => () => void
  cancelTranscription: () => Promise<void>
  exportTranscription: (result: TranscriptionResult, format: ExportFormat) => Promise<void>
  getSettings: () => Promise<TranscriberSettings>
  saveSettings: (settings: Partial<TranscriberSettings>) => Promise<void>
}

export interface ElectronAPI {
  getVersion: () => Promise<string>
  openExternal: (url: string) => Promise<void>
  selectTsxFile: () => Promise<string | null>
  selectOutputPath: (format: 'mp4' | 'mov') => Promise<string | null>
  startRender: (options: RenderOptions) => Promise<void>
  onRenderProgress: (callback: (progress: RenderProgress) => void) => () => void
  cancelRender: () => Promise<void>
  transcriber: TranscriberAPI
  updater: UpdaterAPI
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
