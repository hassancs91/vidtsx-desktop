import { app } from 'electron'
import { existsSync, mkdirSync, createWriteStream, unlinkSync, renameSync, readFileSync } from 'fs'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import https from 'https'
import ffmpeg from 'fluent-ffmpeg'
import type {
  WhisperModel,
  ModelStatus,
  TranscriptionResult,
  TranscriptionSegment,
  DownloadProgress
} from '../../shared/types'

interface ModelInfo {
  url: string
  size: string
  fileSize: number
}

const MODEL_INFO: Record<WhisperModel, ModelInfo> = {
  tiny: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    size: '75 MB',
    fileSize: 75_000_000
  },
  base: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    size: '142 MB',
    fileSize: 142_000_000
  },
  small: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    size: '466 MB',
    fileSize: 466_000_000
  },
  medium: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    size: '1.5 GB',
    fileSize: 1_500_000_000
  },
  large: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    size: '2.9 GB',
    fileSize: 2_900_000_000
  }
}

export class WhisperLocalService {
  private _modelsDir: string | null = null
  private _binPath: string | null = null
  private _ffmpegPath: string | null = null
  private downloadingModels: Map<WhisperModel, AbortController> = new Map()
  private transcriptionProcess: ChildProcess | null = null

  private get modelsDir(): string {
    if (!this._modelsDir) {
      const userDataPath = app.getPath('userData')
      this._modelsDir = join(userDataPath, 'whisper-models')
      if (!existsSync(this._modelsDir)) {
        mkdirSync(this._modelsDir, { recursive: true })
      }
    }
    return this._modelsDir
  }

  private get binPath(): string {
    if (!this._binPath) {
      this._binPath = app.isPackaged
        ? join(process.resourcesPath, 'whisper', 'whisper-cli.exe')
        : join(app.getAppPath(), 'resources', 'whisper', 'whisper-cli.exe')
    }
    return this._binPath
  }

  private get ffmpegPath(): string {
    if (!this._ffmpegPath) {
      this._ffmpegPath = app.isPackaged
        ? join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe')
        : join(app.getAppPath(), 'resources', 'ffmpeg', 'ffmpeg.exe')

      if (existsSync(this._ffmpegPath)) {
        ffmpeg.setFfmpegPath(this._ffmpegPath)
      }
    }
    return this._ffmpegPath
  }

  private getModelPath(model: WhisperModel): string {
    return join(this.modelsDir, `ggml-${model}.bin`)
  }

  private async extractAudioIfNeeded(filePath: string): Promise<{ audioPath: string; isTemp: boolean }> {
    const ext = filePath.toLowerCase().split('.').pop() || ''
    const videoFormats = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v']

    if (!videoFormats.includes(ext)) {
      return { audioPath: filePath, isTemp: false }
    }

    // Ensure ffmpeg path is set
    const ffmpegBin = this.ffmpegPath
    if (!existsSync(ffmpegBin)) {
      throw new Error(
        'FFmpeg binary not found. Please run "npm run download:ffmpeg" or ensure ffmpeg is in resources/ffmpeg/ffmpeg.exe'
      )
    }

    console.log('[whisper] Extracting audio from video file...')
    const tempWav = join(this.modelsDir, `temp_audio_${Date.now()}.wav`)

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions(['-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1'])
        .output(tempWav)
        .on('end', () => {
          console.log('[whisper] Audio extraction complete:', tempWav)
          resolve({ audioPath: tempWav, isTemp: true })
        })
        .on('error', (err) => {
          console.error('[whisper] Audio extraction failed:', err)
          reject(new Error(`Failed to extract audio: ${err.message}`))
        })
        .run()
    })
  }

  isModelAvailable(model: WhisperModel): boolean {
    return existsSync(this.getModelPath(model))
  }

  getModelStatus(): ModelStatus[] {
    return (Object.keys(MODEL_INFO) as WhisperModel[]).map(model => ({
      model,
      available: this.isModelAvailable(model),
      size: MODEL_INFO[model].size,
      downloading: this.downloadingModels.has(model),
      downloadProgress: 0
    }))
  }

  async downloadModel(
    model: WhisperModel,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (this.downloadingModels.has(model)) {
      throw new Error(`Model ${model} is already downloading`)
    }

    const abortController = new AbortController()
    this.downloadingModels.set(model, abortController)

    const modelPath = this.getModelPath(model)
    const tempPath = `${modelPath}.tmp`
    const { url, fileSize } = MODEL_INFO[model]

    return new Promise((resolve, reject) => {
      const downloadWithRedirect = (downloadUrl: string) => {
        const file = createWriteStream(tempPath)
        let downloaded = 0

        const request = https.get(downloadUrl, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location
            if (redirectUrl) {
              file.close()
              downloadWithRedirect(redirectUrl)
              return
            }
          }

          if (response.statusCode !== 200) {
            file.close()
            if (existsSync(tempPath)) unlinkSync(tempPath)
            this.downloadingModels.delete(model)
            reject(new Error(`Download failed with status ${response.statusCode}`))
            return
          }

          response.pipe(file)

          response.on('data', (chunk: Buffer) => {
            downloaded += chunk.length
            onProgress({
              model,
              progress: Math.round((downloaded / fileSize) * 100),
              downloaded,
              total: fileSize
            })
          })

          response.on('end', () => {
            file.close()
            try {
              renameSync(tempPath, modelPath)
              this.downloadingModels.delete(model)
              resolve()
            } catch (err) {
              this.downloadingModels.delete(model)
              reject(err)
            }
          })
        })

        request.on('error', (err) => {
          file.close()
          if (existsSync(tempPath)) unlinkSync(tempPath)
          this.downloadingModels.delete(model)
          reject(err)
        })

        abortController.signal.addEventListener('abort', () => {
          request.destroy()
          file.close()
          if (existsSync(tempPath)) unlinkSync(tempPath)
          this.downloadingModels.delete(model)
          reject(new Error('Download cancelled'))
        })
      }

      downloadWithRedirect(url)
    })
  }

  cancelDownload(model?: WhisperModel): void {
    if (model) {
      const controller = this.downloadingModels.get(model)
      if (controller) controller.abort()
    } else {
      this.downloadingModels.forEach(controller => controller.abort())
    }
  }

  async transcribe(
    filePath: string,
    model: WhisperModel,
    onProgress: (progress: number, message: string) => void,
    language?: string
  ): Promise<TranscriptionResult> {
    const modelPath = this.getModelPath(model)

    if (!this.isModelAvailable(model)) {
      throw new Error(`Model ${model} is not available. Please download it first.`)
    }

    if (!existsSync(this.binPath)) {
      throw new Error(
        'Whisper binary not found. Please ensure the whisper executable is in resources/whisper/whisper-cli.exe'
      )
    }

    // Extract audio from video files if needed
    onProgress(0, 'Preparing audio...')
    const { audioPath, isTemp } = await this.extractAudioIfNeeded(filePath)

    return new Promise((resolve, reject) => {
      const outputPath = join(this.modelsDir, `output_${Date.now()}.json`)

      const args = [
        '-m', modelPath,
        '-f', audioPath,
        '-oj',
        '-of', outputPath.replace('.json', ''),
        '--print-progress'
      ]

      if (language) {
        args.push('-l', language)
      }

      console.log('[whisper] Binary:', this.binPath)
      console.log('[whisper] Args:', args)
      console.log('[whisper] Expected output:', outputPath)

      this.transcriptionProcess = spawn(this.binPath, args)

      let errorOutput = ''

      const cleanup = () => {
        // Clean up temp audio file if we created one
        if (isTemp && existsSync(audioPath)) {
          try {
            unlinkSync(audioPath)
            console.log('[whisper] Cleaned up temp audio file')
          } catch (e) {
            console.error('[whisper] Failed to clean up temp file:', e)
          }
        }
      }

      this.transcriptionProcess.stdout?.on('data', (data) => {
        const text = data.toString()
        const progressMatch = text.match(/progress\s*=\s*(\d+)%/i)
        if (progressMatch) {
          onProgress(parseInt(progressMatch[1]), 'Transcribing...')
        }
      })

      this.transcriptionProcess.stderr?.on('data', (data) => {
        const text = data.toString()
        errorOutput += text
        const progressMatch = text.match(/progress\s*=\s*(\d+)%/i)
        if (progressMatch) {
          onProgress(parseInt(progressMatch[1]), 'Transcribing...')
        }
      })

      this.transcriptionProcess.on('close', (code) => {
        this.transcriptionProcess = null
        console.log('[whisper] Exit code:', code)
        console.log('[whisper] Stderr output:', errorOutput)

        if (code === 0) {
          try {
            const jsonPath = outputPath
            console.log('[whisper] Checking for file:', jsonPath)
            if (existsSync(jsonPath)) {
              const jsonContent = readFileSync(jsonPath, 'utf-8')
              const result = this.parseWhisperJson(jsonContent)
              unlinkSync(jsonPath)
              cleanup()
              resolve(result)
            } else {
              cleanup()
              reject(new Error('Transcription output file not found'))
            }
          } catch (err) {
            cleanup()
            reject(new Error(`Failed to parse transcription output: ${err}`))
          }
        } else {
          cleanup()
          reject(new Error(errorOutput || `Transcription failed with code ${code}`))
        }
      })

      this.transcriptionProcess.on('error', (err) => {
        this.transcriptionProcess = null
        cleanup()
        reject(err)
      })
    })
  }

  private parseWhisperJson(jsonContent: string): TranscriptionResult {
    const data = JSON.parse(jsonContent)

    const segments: TranscriptionSegment[] = (data.transcription || []).map(
      (seg: any, idx: number) => {
        const parseTimestamp = (ts: string): number => {
          const parts = ts.split(':')
          const hours = parseInt(parts[0], 10)
          const minutes = parseInt(parts[1], 10)
          const seconds = parseFloat(parts[2].replace(',', '.'))
          return hours * 3600 + minutes * 60 + seconds
        }

        return {
          id: idx,
          start: seg.timestamps?.from ? parseTimestamp(seg.timestamps.from) : seg.offsets?.from / 100 || 0,
          end: seg.timestamps?.to ? parseTimestamp(seg.timestamps.to) : seg.offsets?.to / 100 || 0,
          text: (seg.text || '').trim()
        }
      }
    )

    const duration = segments.length > 0 ? segments[segments.length - 1].end : 0
    const language = data.result?.language || 'auto'

    return {
      segments,
      language,
      duration
    }
  }

  cancelTranscription(): void {
    if (this.transcriptionProcess) {
      this.transcriptionProcess.kill('SIGTERM')
      this.transcriptionProcess = null
    }
  }
}

export const whisperLocalService = new WhisperLocalService()
