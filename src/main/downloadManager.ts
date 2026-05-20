import { spawn, ChildProcess, execSync } from 'child_process'
import { join, dirname } from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync, createWriteStream, chmodSync, rmSync, writeFileSync } from 'fs'
import { EventEmitter } from 'events'
import https from 'https'

// ─── GitHub release APIs ──────────────────────────────────────────────────────

const YTDLP_GITHUB_API = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'
const GALLERYDL_GITHUB_API = 'https://api.github.com/repos/mikf/gallery-dl/releases/latest'
const FFMPEG_GITHUB_API = 'https://api.github.com/repos/yt-dlp/FFmpeg-Builds/releases/latest'

async function getLatestAssetUrl(apiUrl: string, assetName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(apiUrl, { headers: { 'User-Agent': 'FetchMeThis/1.0' } }, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try {
          const data = JSON.parse(body)
          const assets: any[] = data.assets || []
          const asset = assets.find((a) => a.name === assetName)
          if (!asset) reject(new Error(`Asset ${assetName} not found in latest release`))
          else resolve(asset.browser_download_url)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
  })
}

function downloadFile(
  url: string,
  dest: string,
  onProgress?: (msg: string) => void,
  label?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const follow = (redirectUrl: string) => {
      https
        .get(redirectUrl, { headers: { 'User-Agent': 'FetchMeThis/1.0' } }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
            follow(res.headers.location!)
            return
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`))
            return
          }
          const total = parseInt(res.headers['content-length'] || '0', 10)
          let received = 0
          const file = createWriteStream(dest)
          res.on('data', (chunk: Buffer) => {
            received += chunk.length
            if (total > 0 && onProgress) {
              const pct = Math.round((received / total) * 100)
              onProgress(`Downloading ${label || 'file'}... ${pct}%`)
            }
          })
          res.pipe(file)
          file.on('finish', () => file.close(() => resolve()))
          file.on('error', reject)
        })
        .on('error', reject)
    }
    follow(url)
  })
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface DownloadRequest {
  id: string
  url: string
  format: string
  outputDir: string
  title: string
  thumbnail?: string
  audioOnly?: boolean
  audioFormat?: string
  useGalleryDl?: boolean
  ffmpegCustomPath?: string
  galleryDlCustomPath?: string
  downloadSubtitles?: boolean
  extractChapters?: boolean
  enrichMetadata?: boolean
  allowPlaylist?: boolean
  platform?: string
}

export interface ProgressData {
  id: string
  percent: number
  speed: string
  speedBytes?: number
  eta: string
  size: string
  downloadedBytes?: number
  totalBytes?: number
}

interface ActiveDownload {
  process: ChildProcess
  aborted: boolean
}

// ─── DownloadManager ─────────────────────────────────────────────────────────

class DownloadManager extends EventEmitter {
  private activeDownloads = new Map<string, ActiveDownload>()
  private ytDlpPath: string
  private galleryDlPath: string
  private galleryDlWrapperPath: string
  private binDir: string

  constructor() {
    super()
    this.binDir = join(app.getPath('userData'), 'bin')
    if (!existsSync(this.binDir)) mkdirSync(this.binDir, { recursive: true })
    this.ytDlpPath = join(this.binDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
    this.galleryDlPath = join(
      this.binDir,
      process.platform === 'win32' ? 'gallery-dl.exe' : 'gallery-dl'
    )
    this.galleryDlWrapperPath = join(
      this.binDir,
      process.platform === 'win32' ? 'gallery-dl.cmd' : 'gallery-dl'
    )
  }

  // ─── yt-dlp ─────────────────────────────────────────────────────────────────

  isYtDlpInstalled(): boolean {
    return existsSync(this.ytDlpPath)
  }

  getYtDlpPath(): string {
    return this.ytDlpPath
  }

  async installYtDlp(onProgress?: (msg: string) => void): Promise<void> {
    onProgress?.('Fetching latest yt-dlp release info...')
    let assetName: string
    if (process.platform === 'win32') assetName = 'yt-dlp.exe'
    else if (process.platform === 'darwin') assetName = 'yt-dlp_macos'
    else assetName = 'yt-dlp_linux'
    const url = await getLatestAssetUrl(YTDLP_GITHUB_API, assetName)
    await downloadFile(url, this.ytDlpPath, onProgress, 'yt-dlp')
    if (process.platform !== 'win32') chmodSync(this.ytDlpPath, 0o755)
    onProgress?.('yt-dlp installed successfully')
  }

  // ─── ffmpeg ─────────────────────────────────────────────────────────────────

  findFfmpeg(customPath?: string): string | null {
    if (customPath && existsSync(customPath)) return customPath
    const binExe = join(this.binDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
    if (existsSync(binExe)) return binExe
    try {
      const cmd = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg'
      const result = execSync(cmd, { encoding: 'utf-8', timeout: 3000 }).trim().split('\n')[0].trim()
      if (result && existsSync(result)) return result
    } catch { /* not in PATH */ }
    return null
  }

  isFfmpegAvailable(customPath?: string): boolean {
    return this.findFfmpeg(customPath) !== null
  }

  getFfmpegBinPath(): string {
    return join(this.binDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
  }

  async installFfmpeg(onProgress?: (msg: string) => void): Promise<void> {
    if (process.platform !== 'win32') {
      throw new Error(
        'Auto-install is Windows-only. Install ffmpeg via your package manager (e.g. brew install ffmpeg).'
      )
    }
    onProgress?.('Fetching latest FFmpeg release info...')
    const assetName = 'ffmpeg-master-latest-win64-gpl.zip'
    const assetUrl = await getLatestAssetUrl(FFMPEG_GITHUB_API, assetName)
    const zipPath = join(this.binDir, '_ffmpeg_download.zip')
    const tmpDir = join(this.binDir, '_ffmpeg_tmp')
    try {
      await downloadFile(assetUrl, zipPath, onProgress, 'FFmpeg')
      onProgress?.('Extracting FFmpeg...')
      await new Promise<void>((resolve, reject) => {
        const ps = spawn('powershell', [
          '-NoProfile', '-NonInteractive', '-Command',
          `Expand-Archive -Path "${zipPath}" -DestinationPath "${tmpDir}" -Force`
        ])
        ps.on('close', (code) =>
          code === 0 ? resolve() : reject(new Error(`Extraction failed (code ${code})`))
        )
        ps.on('error', reject)
      })
      const destExe = join(this.binDir, 'ffmpeg.exe')
      await new Promise<void>((resolve, reject) => {
        const ps = spawn('powershell', [
          '-NoProfile', '-NonInteractive', '-Command',
          `$f = Get-ChildItem -Path "${tmpDir}" -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1; if ($f) { Copy-Item $f.FullName "${destExe}" } else { exit 1 }`
        ])
        ps.on('close', (code) =>
          code === 0 ? resolve() : reject(new Error('Could not find ffmpeg.exe in archive'))
        )
        ps.on('error', reject)
      })
      onProgress?.('FFmpeg installed successfully')
    } finally {
      try { if (existsSync(zipPath)) rmSync(zipPath) } catch { /* ignore */ }
      try { if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true }) } catch { /* ignore */ }
    }
  }

  // ─── gallery-dl ─────────────────────────────────────────────────────────────

  isGalleryDlInstalled(customPath?: string): boolean {
    if (customPath && existsSync(customPath)) return true
    if (existsSync(this.galleryDlPath) || existsSync(this.galleryDlWrapperPath)) return true
    try {
      const cmd = process.platform === 'win32' ? 'where gallery-dl' : 'which gallery-dl'
      execSync(cmd, { encoding: 'utf-8', timeout: 3000 })
      return true
    } catch { return false }
  }

  getGalleryDlPath(customPath?: string): string {
    if (customPath && existsSync(customPath)) return customPath
    if (existsSync(this.galleryDlPath)) return this.galleryDlPath
    if (existsSync(this.galleryDlWrapperPath)) return this.galleryDlWrapperPath
    const systemPath = this.findGalleryDlInPath()
    if (systemPath) return systemPath
    return this.galleryDlPath
  }

  resolveGalleryDlBin(customPath?: string): string {
    if (customPath && existsSync(customPath)) return customPath
    if (existsSync(this.galleryDlPath)) return this.galleryDlPath
    if (existsSync(this.galleryDlWrapperPath)) return this.galleryDlWrapperPath
    const systemPath = this.findGalleryDlInPath()
    if (systemPath) return systemPath
    return 'gallery-dl'
  }

  private findPython(): string | null {
    const candidates = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python']
    for (const candidate of candidates) {
      try {
        execSync(`${candidate} --version`, { encoding: 'utf-8', timeout: 3000 })
        return candidate
      } catch {
        continue
      }
    }
    return null
  }

  private findGalleryDlInPath(): string | null {
    try {
      const cmd = process.platform === 'win32' ? 'where gallery-dl' : 'which gallery-dl'
      const result = execSync(cmd, { encoding: 'utf-8', timeout: 3000 }).trim().split(/\r?\n/)[0].trim()
      return result || null
    } catch {
      return null
    }
  }

  private async installGalleryDlViaPip(onProgress?: (msg: string) => void): Promise<void> {
    const python = this.findPython()
    if (!python) {
      throw new Error(
        'gallery-dl binary asset unavailable and Python is not installed. Install Python, then run: pip install gallery-dl'
      )
    }

    onProgress?.('Installing gallery-dl via pip...')
    const targetDir = join(this.binDir, 'gallery-dl-py')
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true })

    execSync(`${python} -m pip install --upgrade --target "${targetDir}" gallery-dl`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 600000
    })

    const wrapperPath = this.galleryDlWrapperPath
    const wrapperContent = process.platform === 'win32'
      ? `@echo off\r\nset PYTHONPATH=${targetDir}\r\n"${python}" -m gallery_dl %*\r\n`
      : `#!/bin/sh\nPYTHONPATH="${targetDir}" exec "${python}" -m gallery_dl "$@"\n`

    writeFileSync(wrapperPath, wrapperContent, { encoding: 'utf-8' })
    if (process.platform !== 'win32') chmodSync(wrapperPath, 0o755)
    onProgress?.('gallery-dl installed successfully via pip')
  }

  async installGalleryDl(onProgress?: (msg: string) => void): Promise<void> {
    if (process.platform === 'darwin') {
      throw new Error('Auto-install not available on macOS. Install via: pip install gallery-dl')
    }
    onProgress?.('Fetching latest gallery-dl release...')
    const assetName = process.platform === 'win32' ? 'gallery-dl.exe' : 'gallery-dl.bin'
    try {
      const assetUrl = await getLatestAssetUrl(GALLERYDL_GITHUB_API, assetName)
      await downloadFile(assetUrl, this.galleryDlPath, onProgress, 'gallery-dl')
      if (process.platform !== 'win32') chmodSync(this.galleryDlPath, 0o755)
      onProgress?.('gallery-dl installed successfully')
      return
    } catch (err: any) {
      if (err?.message?.includes('Asset') || err?.message?.includes('not found')) {
        onProgress?.('Gallery-dl binary asset not found; falling back to pip installation...')
        await this.installGalleryDlViaPip(onProgress)
        return
      }
      throw err
    }
  }

  // ─── Video info ─────────────────────────────────────────────────────────────

  async fetchVideoInfo(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ytDlpPath, [url, '--dump-json', '--no-playlist', '--no-warnings'])
      let stdout = ''
      let stderr = ''
      proc.stdout.on('data', (d: Buffer) => (stdout += d.toString()))
      proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()))
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`))
          return
        }
        try {
          resolve(JSON.parse(stdout.trim().split('\n')[0]))
        } catch {
          reject(new Error('Failed to parse video info'))
        }
      })
      proc.on('error', reject)
    })
  }

  private emitDownloadLog(id: string, source: string, message: string) {
    this.emit('download-log', { id, source, message })
  }

  // ─── Downloads ──────────────────────────────────────────────────────────────

  async startDownload(request: DownloadRequest): Promise<void> {
    if (request.useGalleryDl) return this.startGalleryDlDownload(request)
    return this.startYtDlpDownload(request)
  }

  private async startYtDlpDownload(req: DownloadRequest): Promise<void> {
    const { id, url, format, outputDir, audioOnly, audioFormat, ffmpegCustomPath, downloadSubtitles, extractChapters, enrichMetadata, allowPlaylist } = req
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

    const outputTemplate = join(outputDir, '%(title).100s [%(id)s].%(ext)s')
    const ffmpegBin = this.findFfmpeg(ffmpegCustomPath)
    const args: string[] = [url]

    if (audioOnly) {
      args.push(
        '-f', 'bestaudio/best',
        '--extract-audio',
        '--audio-format', audioFormat || 'mp3',
        '--audio-quality', '0',
        '-o', outputTemplate,
        allowPlaylist ? '--yes-playlist' : '--no-playlist',
        '--newline',
        '--no-part',
        '--no-continue',
        '--no-overwrites',
        '--no-warnings'
      )
      if (ffmpegBin) {
        args.push('--embed-thumbnail', '--add-metadata')
      }
    } else {
      args.push(
        '-f', format,
        '-o', outputTemplate,
        allowPlaylist ? '--yes-playlist' : '--no-playlist',
        '--newline',
        '--no-part',
        '--no-continue',
        '--no-overwrites',
        '--merge-output-format', 'mp4',
        '--no-warnings'
      )
    }

    // Add optional subtitle/chapter/metadata flags
    if (downloadSubtitles) {
      args.push('--write-subs', '--sub-langs', 'en,-live')
    }
    if (extractChapters) {
      args.push('--split-chapters')
    }
    if (enrichMetadata) {
      args.push('--embed-metadata', '--add-metadata')
    }

    if (ffmpegBin) {
      args.push('--ffmpeg-location', dirname(ffmpegBin))
    }

    const proc = spawn(this.ytDlpPath, args)
    const active: ActiveDownload = { process: proc, aborted: false }
    this.activeDownloads.set(id, active)

    let stdoutBuffer = ''
    let fileAlreadyExists = false
    const handleStdout = (chunk: Buffer) => {
      if (active.aborted) return
      stdoutBuffer += chunk.toString()
      const lines = stdoutBuffer.split(/\r?\n/)
      stdoutBuffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        this.emitDownloadLog(id, 'yt-dlp', line)
        // Detect if file already exists
        if (line.includes('has already been downloaded') || line.includes('[download] Skipping')) {
          fileAlreadyExists = true
        }
        const progress = this.parseYtDlpProgress(line)
        if (progress) this.emit('progress', { id, ...progress })
      }
    }

    let stderrBuffer = ''
    const handleStderr = (chunk: Buffer) => {
      if (active.aborted) return
      stderrBuffer += chunk.toString()
      const lines = stderrBuffer.split(/\r?\n/)
      stderrBuffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        this.emitDownloadLog(id, 'yt-dlp', line)
      }
    }

    proc.stdout.on('data', handleStdout)
    proc.stderr.on('data', handleStderr)

    proc.on('error', (err) => {
      this.activeDownloads.delete(id)
      if (!active.aborted) this.emit('error', { id, error: err.message })
    })

    proc.on('close', (code) => {
      this.activeDownloads.delete(id)
      if (!active.aborted) {
        if (code === 0) {
          if (fileAlreadyExists) {
            this.emit('error', { id, error: 'This file has already been downloaded. Skipping to avoid overwrite.' })
          } else {
            this.emit('complete', { id })
          }
        } else {
          this.emit('error', { id, error: `yt-dlp exited with code ${code}` })
        }
      }
    })
  }

  private async startGalleryDlDownload(req: DownloadRequest): Promise<void> {
    const { id, url, outputDir, galleryDlCustomPath } = req
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

    const galleryDlBin = this.resolveGalleryDlBin(galleryDlCustomPath)
    const args = [url, '--dest', outputDir, '--no-mtime']
    const spawnOptions = process.platform === 'win32' && galleryDlBin.toLowerCase().endsWith('.cmd')
      ? { shell: true }
      : undefined
    const proc = spawn(galleryDlBin, args, spawnOptions)
    const active: ActiveDownload = { process: proc, aborted: false }
    this.activeDownloads.set(id, active)

    let fileCount = 0
    let stdoutBuffer = ''
    let stderrBuffer = ''

    const appendOutput = (chunk: Buffer, source: string) => {
      if (active.aborted) return
      const buffer = source === 'stdout' ? stdoutBuffer + chunk.toString() : stderrBuffer + chunk.toString()
      const lines = buffer.split(/\r?\n/)
      const remaining = lines.pop() || ''
      if (source === 'stdout') stdoutBuffer = remaining
      else stderrBuffer = remaining
      for (const line of lines) {
        if (!line.trim()) continue
        this.emitDownloadLog(id, 'gallery-dl', line)
        if (line.includes('Downloading') || line.includes('Saving') || /\.\w{2,5}$/.test(line.trim())) {
          fileCount += 1
          this.emit('progress', {
            id,
            percent: -1,
            speed: '',
            eta: '',
            size: `${fileCount} file${fileCount !== 1 ? 's' : ''}`
          })
        }
      }
    }

    proc.stdout.on('data', (chunk: Buffer) => appendOutput(chunk, 'stdout'))
    proc.stderr.on('data', (chunk: Buffer) => appendOutput(chunk, 'stderr'))

    proc.on('error', (err) => {
      this.activeDownloads.delete(id)
      if (!active.aborted) this.emit('error', { id, error: err.message })
    })

    proc.on('close', (code) => {
      this.activeDownloads.delete(id)
      if (!active.aborted) {
        if (code === 0) this.emit('complete', { id })
        else this.emit('error', { id, error: `gallery-dl exited with code ${code}` })
      }
    })
  }

  cancelDownload(id: string): void {
    const active = this.activeDownloads.get(id)
    if (active) {
      active.aborted = true
      try { active.process.kill('SIGTERM') } catch { /* already exited */ }
      this.activeDownloads.delete(id)
      this.emit('cancelled', { id })
    }
  }

  private parseYtDlpProgress(line: string): Omit<ProgressData, 'id'> | null {
    const match = line.match(
      /\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\S+)\s+at\s+(\S+)\s+ETA\s+(\S+)/
    )
    if (!match) return null
    
    const speedStr = match[3]
    const speedBytes = this.parseSpeed(speedStr)
    
    return {
      percent: parseFloat(match[1]),
      size: match[2],
      speed: speedStr,
      speedBytes,
      eta: match[4]
    }
  }

  private parseSpeed(speedStr: string): number {
    // Parse speed strings like "5.23MiB/s", "1.5MB/s", "500KiB/s", "Unknown"
    const match = speedStr.match(/^(\d+\.?\d*)\s*([KMG]i?B)\/s$/i)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1000,
      'KIB': 1024,
      'MB': 1000 * 1000,
      'MIB': 1024 * 1024,
      'GB': 1000 * 1000 * 1000,
      'GIB': 1024 * 1024 * 1024
    }
    
    return value * (multipliers[unit] || 1)
  }
}

export const downloadManager = new DownloadManager()
