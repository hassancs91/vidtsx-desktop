import { useState, useEffect } from 'react'
import type { RenderProgress } from '../../../../shared/types'

type RenderFormat = 'mp4' | 'mov'
type RenderStatus = 'idle' | 'rendering' | 'complete' | 'error'

export function TsxRenderer() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [format, setFormat] = useState<RenderFormat>('mp4')
  const [status, setStatus] = useState<RenderStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const unsubscribe = window.electronAPI.onRenderProgress((data: RenderProgress) => {
      setProgress(data.progress)
      setMessage(data.message || '')

      if (data.phase === 'complete') {
        setStatus('complete')
      } else if (data.phase === 'error') {
        setStatus('error')
      }
    })

    return unsubscribe
  }, [])

  const handleSelectFile = async () => {
    const path = await window.electronAPI.selectTsxFile()
    if (path) {
      setSelectedFile(path)
      setStatus('idle')
      setProgress(0)
      setMessage('')
    }
  }

  const handleRender = async () => {
    if (!selectedFile) return

    const outputPath = await window.electronAPI.selectOutputPath(format)
    if (!outputPath) return

    setStatus('rendering')
    setProgress(0)
    setMessage('Starting render...')

    try {
      await window.electronAPI.startRender({
        tsxPath: selectedFile,
        outputPath,
        format
      })
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Render failed')
    }
  }

  const handleCancel = async () => {
    await window.electronAPI.cancelRender()
    setStatus('idle')
    setProgress(0)
    setMessage('Cancelled')
  }

  const getFileName = (path: string) => {
    return path.split(/[/\\]/).pop() || path
  }

  return (
    <div className="neo-card p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>TSX RENDERER</span>
      </h2>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Selected File</label>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-neo-bg border-2 border-black rounded-lg font-mono text-sm truncate">
            {selectedFile ? getFileName(selectedFile) : 'No file selected'}
          </div>
          <button
            onClick={handleSelectFile}
            className="neo-btn neo-btn-secondary"
            disabled={status === 'rendering'}
          >
            Browse
          </button>
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Output Format</label>
        <div className="format-toggle">
          <button
            className={`format-btn ${format === 'mp4' ? 'active' : ''}`}
            onClick={() => setFormat('mp4')}
            disabled={status === 'rendering'}
          >
            MP4
          </button>
          <button
            className={`format-btn ${format === 'mov' ? 'active' : ''}`}
            onClick={() => setFormat('mov')}
            disabled={status === 'rendering'}
          >
            MOV
          </button>
        </div>
      </div>

      {/* Progress */}
      {status !== 'idle' && (
        <div className="mb-6">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>{message}</span>
            <span>{progress}%</span>
          </div>
          <div className="neo-progress">
            <div
              className="neo-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Message */}
      {status === 'complete' && (
        <div className="mb-6 p-3 bg-green-100 border-2 border-black rounded-lg">
          <span className="font-semibold text-green-800">Render complete!</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-3 bg-red-100 border-2 border-black rounded-lg">
          <span className="font-semibold text-red-800">{message}</span>
        </div>
      )}

      {/* Render Button */}
      <div className="flex gap-3">
        {status === 'rendering' ? (
          <button
            onClick={handleCancel}
            className="neo-btn neo-btn-primary flex-1"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={handleRender}
            className="neo-btn neo-btn-primary flex-1"
            disabled={!selectedFile}
          >
            Render Video
          </button>
        )}
      </div>
    </div>
  )
}
