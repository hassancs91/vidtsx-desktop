import { useState, useEffect, useCallback } from 'react'
import type {
  WhisperModel,
  ModelStatus,
  TranscriptionResult,
  TranscriptionProgress,
  TranscriberSettings,
  ExportFormat
} from '../../shared/types'

export function useTranscription() {
  const [settings, setSettings] = useState<TranscriberSettings | null>(null)
  const [models, setModels] = useState<ModelStatus[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [downloadingModel, setDownloadingModel] = useState<WhisperModel | null>(null)

  const loadSettings = useCallback(async () => {
    const s = await window.electronAPI.transcriber.getSettings()
    setSettings(s)
  }, [])

  const loadModelStatus = useCallback(async () => {
    const status = await window.electronAPI.transcriber.getModelStatus()
    setModels(status)
  }, [])

  // Load settings and model status on mount
  useEffect(() => {
    loadSettings()
    loadModelStatus()
  }, [loadSettings, loadModelStatus])

  // Subscribe to progress events
  useEffect(() => {
    const unsubProgress = window.electronAPI.transcriber.onTranscriptionProgress(
      (prog) => {
        setProgress(prog)
        if (prog.phase === 'complete' || prog.phase === 'error') {
          setIsTranscribing(false)
        }
      }
    )

    const unsubDownload = window.electronAPI.transcriber.onDownloadProgress(
      (prog) => {
        setModels((prev) =>
          prev.map((m) =>
            m.model === prog.model
              ? { ...m, downloading: true, downloadProgress: prog.progress }
              : m
          )
        )
        if (prog.progress >= 100) {
          setDownloadingModel(null)
          loadModelStatus()
        }
      }
    )

    return () => {
      unsubProgress()
      unsubDownload()
    }
  }, [loadModelStatus])

  const updateSettings = useCallback(async (updates: Partial<TranscriberSettings>) => {
    await window.electronAPI.transcriber.saveSettings(updates)
    setSettings((prev) => (prev ? { ...prev, ...updates } : prev))
  }, [])

  const selectFile = useCallback(async () => {
    const path = await window.electronAPI.transcriber.selectMediaFile()
    if (path) {
      setSelectedFile(path)
      setResult(null)
      setProgress(null)
    }
  }, [])

  const downloadModel = useCallback(async (model: WhisperModel) => {
    setDownloadingModel(model)
    setModels((prev) =>
      prev.map((m) =>
        m.model === model ? { ...m, downloading: true, downloadProgress: 0 } : m
      )
    )
    try {
      await window.electronAPI.transcriber.downloadModel(model)
      await loadModelStatus()
    } catch (error) {
      console.error('Download failed:', error)
      setModels((prev) =>
        prev.map((m) =>
          m.model === model ? { ...m, downloading: false, downloadProgress: 0 } : m
        )
      )
    } finally {
      setDownloadingModel(null)
    }
  }, [loadModelStatus])

  const startTranscription = useCallback(async () => {
    if (!selectedFile || !settings) return

    setIsTranscribing(true)
    setResult(null)
    setProgress({ phase: 'preparing', progress: 0, message: 'Preparing...' })

    try {
      const transcriptionResult = await window.electronAPI.transcriber.startTranscription({
        filePath: selectedFile,
        method: 'local',
        model: settings.selectedModel
      })
      setResult(transcriptionResult)
    } catch (error) {
      console.error('Transcription failed:', error)
    } finally {
      setIsTranscribing(false)
    }
  }, [selectedFile, settings])

  const cancelTranscription = useCallback(async () => {
    await window.electronAPI.transcriber.cancelTranscription()
    setIsTranscribing(false)
    setProgress(null)
  }, [])

  const exportResult = useCallback(async (format: ExportFormat) => {
    if (!result) return
    await window.electronAPI.transcriber.exportTranscription(result, format)
  }, [result])

  const reset = useCallback(() => {
    setSelectedFile(null)
    setResult(null)
    setProgress(null)
    setIsTranscribing(false)
  }, [])

  return {
    settings,
    models,
    selectedFile,
    result,
    progress,
    isTranscribing,
    downloadingModel,
    updateSettings,
    selectFile,
    downloadModel,
    startTranscription,
    cancelTranscription,
    exportResult,
    loadModelStatus,
    reset
  }
}
