import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { createServer, Server } from 'http'
import { createReadStream } from 'fs'
import { lookup } from 'mime-types'
import type { RenderOptions, RenderProgress } from '../../shared/types'

interface CompositionConfig {
  id: string
  width: number
  height: number
  fps: number
  durationInFrames?: number
  durationInSeconds?: number
}

export class RenderService {
  private server: Server | null = null
  private abortController: AbortController | null = null

  async render(
    options: RenderOptions,
    onProgress: (progress: RenderProgress) => void
  ): Promise<void> {
    const { tsxPath, outputPath, format } = options

    const remotionDir = app.isPackaged
      ? join(app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'remotion')
      : join(__dirname, '..', 'remotion')

    const compositionsDir = join(remotionDir, 'src', 'compositions')
    const tempTsxPath = join(compositionsDir, 'TempComposition.tsx')
    const rootBackupPath = join(remotionDir, 'src', 'Root.backup.tsx')
    const rootPath = join(remotionDir, 'src', 'Root.tsx')

    if (!existsSync(compositionsDir)) {
      mkdirSync(compositionsDir, { recursive: true })
    }

    const tsxContent = readFileSync(tsxPath, 'utf-8')
    const config = this.extractCompositionConfig(tsxContent)

    if (!config) {
      throw new Error(
        'Could not find compositionConfig in TSX file.\n\n' +
        'Make sure your file exports a compositionConfig object like:\n\n' +
        'export const compositionConfig = {\n' +
        '  id: "MyComposition",\n' +
        '  width: 1920,\n' +
        '  height: 1080,\n' +
        '  fps: 30,\n' +
        '  durationInFrames: 150,\n' +
        '};'
      )
    }

    try {
      // Backup original Root.tsx
      if (existsSync(rootPath)) {
        copyFileSync(rootPath, rootBackupPath)
      }

      // Copy user's TSX file
      copyFileSync(tsxPath, tempTsxPath)

      // Create dynamic Root.tsx that imports the user's composition
      const dynamicRoot = this.createDynamicRoot(config)
      writeFileSync(rootPath, dynamicRoot)

      // Step 1: Bundle the composition
      onProgress({ phase: 'bundling', progress: 0, message: 'Bundling composition...' })

      const bundlePath = await bundle({
        entryPoint: join(remotionDir, 'src', 'index.ts'),
        onProgress: (p) => {
          onProgress({
            phase: 'bundling',
            progress: Math.round(p * 50),
            message: `Bundling: ${Math.round(p * 100)}%`
          })
        },
      })

      // Step 2: Start local server to serve the bundle
      const serveUrl = await this.startServer(bundlePath)

      // Step 3: Select composition
      onProgress({ phase: 'bundling', progress: 60, message: 'Loading composition...' })

      const composition = await selectComposition({
        serveUrl,
        id: config.id,
        binariesDirectory: app.isPackaged
          ? join(process.resourcesPath, 'compositor')
          : null,
      })

      // Step 4: Render the video
      this.abortController = new AbortController()
      const codec = format === 'mp4' ? 'h264' : 'prores'

      onProgress({ phase: 'rendering', progress: 0, message: 'Rendering frames...' })

      await renderMedia({
        composition,
        serveUrl,
        codec,
        outputLocation: outputPath,
        overwrite: true,
        binariesDirectory: app.isPackaged
          ? join(process.resourcesPath, 'compositor')
          : null,
        proResProfile: codec === 'prores' ? '4444' : undefined,
        pixelFormat: codec === 'prores' ? 'yuva444p10le' : undefined,
        imageFormat: codec === 'prores' ? 'png' : undefined,
        onProgress: ({ progress }) => {
          onProgress({
            phase: 'rendering',
            progress: Math.round(progress * 100),
            message: `Rendering: ${Math.round(progress * 100)}%`,
          })
        },
      })

      onProgress({ phase: 'complete', progress: 100, message: 'Render complete!' })
    } finally {
      this.cleanup(tempTsxPath, rootBackupPath, rootPath)
    }
  }

  private async startServer(bundlePath: string): Promise<string> {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => {
        const urlPath = req.url === '/' ? '/index.html' : req.url || '/index.html'
        const filePath = join(bundlePath, urlPath)

        if (existsSync(filePath)) {
          const mimeType = lookup(filePath) || 'application/octet-stream'
          res.writeHead(200, { 'Content-Type': mimeType })
          createReadStream(filePath).pipe(res)
        } else {
          res.writeHead(404)
          res.end('Not found')
        }
      })

      this.server.listen(0, 'localhost', () => {
        const addr = this.server!.address() as { port: number }
        resolve(`http://localhost:${addr.port}`)
      })
    })
  }

  private cleanup(tempTsxPath: string, rootBackupPath: string, rootPath: string) {
    try {
      if (existsSync(tempTsxPath)) {
        unlinkSync(tempTsxPath)
      }
      // Restore original Root.tsx
      if (existsSync(rootBackupPath)) {
        copyFileSync(rootBackupPath, rootPath)
        unlinkSync(rootBackupPath)
      }
      if (this.server) {
        this.server.close()
        this.server = null
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  private extractCompositionConfig(tsxContent: string): CompositionConfig | null {
    // Look for compositionConfig = { ... }
    const configMatch = tsxContent.match(
      /export\s+const\s+compositionConfig\s*=\s*\{([^}]+)\}/s
    )

    if (!configMatch) return null

    const configStr = configMatch[1]

    // Extract individual properties
    const idMatch = configStr.match(/id\s*:\s*['"]([^'"]+)['"]/)
    const widthMatch = configStr.match(/width\s*:\s*(\d+)/)
    const heightMatch = configStr.match(/height\s*:\s*(\d+)/)
    const fpsMatch = configStr.match(/fps\s*:\s*(\d+)/)
    const durationFramesMatch = configStr.match(/durationInFrames\s*:\s*(\d+)/)
    const durationSecondsMatch = configStr.match(/durationInSeconds\s*:\s*(\d+(?:\.\d+)?)/)

    if (!idMatch || !widthMatch || !heightMatch || !fpsMatch) {
      return null
    }

    return {
      id: idMatch[1],
      width: parseInt(widthMatch[1], 10),
      height: parseInt(heightMatch[1], 10),
      fps: parseInt(fpsMatch[1], 10),
      durationInFrames: durationFramesMatch ? parseInt(durationFramesMatch[1], 10) : undefined,
      durationInSeconds: durationSecondsMatch ? parseFloat(durationSecondsMatch[1]) : undefined,
    }
  }

  private createDynamicRoot(config: CompositionConfig): string {
    const durationInFrames = config.durationInFrames ||
      (config.durationInSeconds ? Math.round(config.durationInSeconds * config.fps) : 150)

    return `import { Composition } from 'remotion'
import UserComposition, { compositionConfig } from './compositions/TempComposition'

export const Root = () => {
  return (
    <>
      <Composition
        id="${config.id}"
        component={UserComposition}
        durationInFrames={${durationInFrames}}
        fps={${config.fps}}
        width={${config.width}}
        height={${config.height}}
      />
    </>
  )
}
`
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }
}
