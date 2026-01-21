import type { ExportFormat } from '../../../../shared/types'

interface Props {
  onExport: (format: ExportFormat) => void
}

export function ExportOptions({ onExport }: Props) {
  const formats: { format: ExportFormat; label: string; description: string }[] = [
    { format: 'srt', label: 'SRT', description: 'SubRip subtitle format' },
    { format: 'vtt', label: 'VTT', description: 'WebVTT subtitle format' },
    { format: 'txt', label: 'TXT', description: 'Plain text transcript' },
    { format: 'json', label: 'JSON', description: 'Full data with timestamps' }
  ]

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold">Export As</label>
      <div className="flex gap-2 flex-wrap">
        {formats.map(({ format, label }) => (
          <button
            key={format}
            onClick={() => onExport(format)}
            className="neo-btn neo-btn-accent text-sm py-2 px-4"
            title={formats.find(f => f.format === format)?.description}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
