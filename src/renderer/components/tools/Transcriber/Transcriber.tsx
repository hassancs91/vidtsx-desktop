import { useTranscription } from '../../../hooks/useTranscription'
import { LocalWhisperSettings } from './LocalWhisperSettings'
import { FileSelector } from './FileSelector'
import { TranscriptionProgress } from './TranscriptionProgress'
import { TranscriptionResult } from './TranscriptionResult'
import { ExportOptions } from './ExportOptions'

export function Transcriber() {
  const {
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
    reset
  } = useTranscription()

  if (!settings) {
    return (
      <div className="neo-card p-6">
        <p>Loading settings...</p>
      </div>
    )
  }

  const selectedModel = models.find(m => m.model === settings.selectedModel)
  const canTranscribe = selectedFile && selectedModel?.available

  return (
    <div className="neo-card p-6 space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <span>TRANSCRIBER</span>
      </h2>

      {/* Whisper Model Settings */}
      <LocalWhisperSettings
        models={models}
        selectedModel={settings.selectedModel}
        downloadingModel={downloadingModel}
        onSelectModel={(model) => updateSettings({ selectedModel: model })}
        onDownloadModel={downloadModel}
        disabled={isTranscribing}
      />

      {/* File Selection */}
      <FileSelector
        selectedFile={selectedFile}
        onSelectFile={selectFile}
        disabled={isTranscribing}
      />

      {/* Progress */}
      {progress && isTranscribing && (
        <TranscriptionProgress
          progress={progress}
          onCancel={cancelTranscription}
        />
      )}

      {/* Status Messages */}
      {progress?.phase === 'complete' && !result && (
        <div className="p-3 bg-green-100 border-2 border-black rounded-lg">
          <span className="font-semibold text-green-800">Transcription complete!</span>
        </div>
      )}

      {progress?.phase === 'error' && (
        <div className="p-3 bg-red-100 border-2 border-black rounded-lg">
          <span className="font-semibold text-red-800">{progress.message}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <TranscriptionResult result={result} />
          <ExportOptions onExport={exportResult} />
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isTranscribing ? (
          <button
            onClick={cancelTranscription}
            className="neo-btn neo-btn-primary flex-1"
          >
            Cancel
          </button>
        ) : result ? (
          <button
            onClick={reset}
            className="neo-btn neo-btn-secondary flex-1"
          >
            New Transcription
          </button>
        ) : (
          <button
            onClick={startTranscription}
            className="neo-btn neo-btn-primary flex-1"
            disabled={!canTranscribe}
          >
            Start Transcription
          </button>
        )}
      </div>
    </div>
  )
}
