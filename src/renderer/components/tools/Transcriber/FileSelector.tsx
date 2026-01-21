interface Props {
  selectedFile: string | null
  onSelectFile: () => void
  disabled: boolean
}

export function FileSelector({ selectedFile, onSelectFile, disabled }: Props) {
  const getFileName = (path: string) => path.split(/[/\\]/).pop() || path

  return (
    <div>
      <label className="block text-sm font-semibold mb-2">Media File</label>
      <div className="flex items-center gap-3">
        <div className="flex-1 px-4 py-3 bg-neo-bg border-2 border-black rounded-lg font-mono text-sm truncate">
          {selectedFile ? getFileName(selectedFile) : 'No file selected'}
        </div>
        <button
          onClick={onSelectFile}
          className="neo-btn neo-btn-secondary"
          disabled={disabled}
        >
          Browse
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Supports MP3, WAV, MP4, MOV, M4A, OGG, FLAC, WebM, AVI, MKV
      </p>
    </div>
  )
}
