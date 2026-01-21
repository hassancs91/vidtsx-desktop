import type { TranscriptionResult as ResultType } from '../../../../shared/types'

interface Props {
  result: ResultType
}

export function TranscriptionResult({ result }: Props) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Transcription Result</h3>
        <div className="text-sm text-gray-600 space-x-3">
          <span>{result.segments.length} segments</span>
          <span>•</span>
          <span>{formatDuration(result.duration)}</span>
          {result.language !== 'auto' && (
            <>
              <span>•</span>
              <span className="uppercase">{result.language}</span>
            </>
          )}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto border-2 border-black rounded-lg bg-white">
        {result.segments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No segments found in transcription
          </div>
        ) : (
          result.segments.map((segment) => (
            <div
              key={segment.id}
              className="p-3 border-b border-gray-200 last:border-b-0 hover:bg-neo-bg transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-500 font-mono whitespace-nowrap pt-0.5">
                  {formatTime(segment.start)} - {formatTime(segment.end)}
                </span>
                <p className="text-sm flex-1">{segment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
