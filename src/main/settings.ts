import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

export interface AppSettings {
  downloadPath: string
  maxConcurrentDownloads: number
  defaultFormat: string
  embedThumbnail: boolean
  addMetadata: boolean
  ytdlpCustomPath: string
  ffmpegCustomPath: string
  galleryDlCustomPath: string
  downloadSubtitles: boolean
  extractChapters: boolean
  enrichMetadata: boolean
  autoOrganize: boolean
  organizePattern: 'platform-date' | 'date-platform' | 'uploader-date' | 'none'
  checkDuplicates: boolean
}

export const defaultSettings: AppSettings = {
  downloadPath: join(app.getPath('downloads'), 'FetchMeThis'),
  maxConcurrentDownloads: 3,
  defaultFormat: 'bestvideo+bestaudio/best',
  embedThumbnail: true,
  addMetadata: true,
  ytdlpCustomPath: '',
  ffmpegCustomPath: '',
  galleryDlCustomPath: '',
  downloadSubtitles: false,
  extractChapters: false,
  enrichMetadata: false,
  autoOrganize: false,
  organizePattern: 'platform-date',
  checkDuplicates: true
}

const settingsPath = join(app.getPath('userData'), 'settings.json')

export function getSettings(): AppSettings {
  try {
    if (!existsSync(settingsPath)) return defaultSettings
    const raw = readFileSync(settingsPath, 'utf-8')
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings()
  writeFileSync(settingsPath, JSON.stringify({ ...current, ...settings }, null, 2))
}
