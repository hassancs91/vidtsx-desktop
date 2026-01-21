import { whisperLocalService } from './whisper-local'
import type {
  TranscriptionOptions,
  TranscriptionResult,
  ExportFormat,
  TranscriptionSegment
} from '../../shared/types'

export class TranscriberService {
  async transcribe(
    options: TranscriptionOptions,
    onProgress: (progress: number, message: string) => void
  ): Promise<TranscriptionResult> {
    const { filePath, model, language } = options

    if (!model) {
      throw new Error('Model must be specified for transcription')
    }
    return whisperLocalService.transcribe(filePath, model, onProgress, language)
  }

  exportTranscription(result: TranscriptionResult, format: ExportFormat): string {
    switch (format) {
      case 'srt':
        return this.toSRT(result.segments)
      case 'vtt':
        return this.toVTT(result.segments)
      case 'txt':
        return this.toPlainText(result.segments)
      case 'json':
        return JSON.stringify(result, null, 2)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  private formatTime(seconds: number, format: 'srt' | 'vtt'): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.round((seconds % 1) * 1000)

    const separator = format === 'srt' ? ',' : '.'
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}${separator}${ms.toString().padStart(3, '0')}`
  }

  private toSRT(segments: TranscriptionSegment[]): string {
    return segments.map((seg, idx) =>
      `${idx + 1}\n${this.formatTime(seg.start, 'srt')} --> ${this.formatTime(seg.end, 'srt')}\n${seg.text}\n`
    ).join('\n')
  }

  private toVTT(segments: TranscriptionSegment[]): string {
    const header = 'WEBVTT\n\n'
    const body = segments.map((seg, idx) =>
      `${idx + 1}\n${this.formatTime(seg.start, 'vtt')} --> ${this.formatTime(seg.end, 'vtt')}\n${seg.text}\n`
    ).join('\n')
    return header + body
  }

  private toPlainText(segments: TranscriptionSegment[]): string {
    return segments.map(seg => seg.text).join(' ')
  }
}

export const transcriberService = new TranscriberService()
