import type { TranscriptionProgress as ProgressType } from '../../../../shared/types'

interface Props {
  progress: ProgressType
  onCancel: () => void
}

export function TranscriptionProgress({ progress, onCancel }: Props) {
  const isActive = progress.phase === 'preparing' || progress.phase === 'transcribing'

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-semibold">
        <span>{progress.message || 'Processing...'}</span>
        <span>{progress.progress}%</span>
      </div>
      <div className="neo-progress">
        <div
          className="neo-progress-bar"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      {isActive && (
        <button
          onClick={onCancel}
          className="neo-btn neo-btn-secondary w-full text-sm"
        >
          Cancel Transcription
        </button>
      )}
    </div>
  )
}
