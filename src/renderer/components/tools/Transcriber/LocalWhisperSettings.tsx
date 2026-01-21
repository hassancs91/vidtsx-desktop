import type { WhisperModel, ModelStatus } from '../../../../shared/types'

interface Props {
  models: ModelStatus[]
  selectedModel: WhisperModel
  downloadingModel: WhisperModel | null
  onSelectModel: (model: WhisperModel) => void
  onDownloadModel: (model: WhisperModel) => void
  disabled: boolean
}

export function LocalWhisperSettings({
  models,
  selectedModel,
  downloadingModel,
  onSelectModel,
  onDownloadModel,
  disabled
}: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">Select Model</label>
      <div className="grid gap-2">
        {models.map((model) => {
          const isSelected = selectedModel === model.model
          const isDownloading = model.downloading || downloadingModel === model.model

          return (
            <div
              key={model.model}
              className={`
                p-3 border-2 border-black rounded-lg transition-colors
                ${isSelected ? 'bg-neo-yellow' : 'bg-white'}
                ${disabled ? 'opacity-50' : ''}
                ${model.available && !disabled ? 'cursor-pointer hover:bg-neo-bg' : ''}
              `}
              onClick={() => {
                if (!disabled && model.available) {
                  onSelectModel(model.model)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-4 h-4 rounded-full border-2 border-black
                      ${isSelected ? 'bg-black' : 'bg-white'}
                    `}
                  />
                  <div>
                    <span className="font-bold uppercase">{model.model}</span>
                    <span className="text-sm text-gray-600 ml-2">({model.size})</span>
                  </div>
                </div>

                {isDownloading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neo-teal transition-all"
                        style={{ width: `${model.downloadProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-10">{model.downloadProgress}%</span>
                  </div>
                ) : model.available ? (
                  <span className="text-sm text-green-700 font-semibold px-2 py-1 bg-green-100 rounded border border-green-700">
                    Available
                  </span>
                ) : (
                  <button
                    className="neo-btn neo-btn-secondary text-sm py-1 px-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownloadModel(model.model)
                    }}
                    disabled={disabled || downloadingModel !== null}
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-500">
        Models are stored locally. Larger models are more accurate but slower.
      </p>
    </div>
  )
}
