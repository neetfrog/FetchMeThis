export type DownloadStatus =
  | 'fetching-info'
  | 'ready'
  | 'queued'
  | 'downloading'
  | 'completed'
  | 'error'
  | 'cancelled'

export interface VideoFormat {
  format_id: string
  ext: string
  resolution?: string
  height?: number
  width?: number
  filesize?: number
  filesize_approx?: number
  vcodec?: string
  acodec?: string
  fps?: number
  tbr?: number
  abr?: number
  format_note?: string
}

export interface VideoInfo {
  id: string
  title: string
  thumbnail?: string
  duration?: number
  uploader?: string
  view_count?: number
  webpage_url: string
  formats?: VideoFormat[]
  description?: string
  extractor?: string
  extractor_key?: string
}

export interface DownloadItem {
  id: string
  url: string
  title: string
  thumbnail?: string
  status: DownloadStatus
  progress: number
  speed?: string
  eta?: string
  size?: string
  filePath?: string
  format: string
  formatLabel: string
  error?: string
  addedAt: number
  completedAt?: number
  extractor?: string
  audioOnly?: boolean
  audioFormat?: string
  useGalleryDl?: boolean
  isPlaylist?: boolean
  playlistSize?: number
  playlistCompleted?: number
  speedHistory?: number[] // bytes/sec for each update
  downloadedBytes?: number
  totalBytes?: number
  uploader?: string
  platform?: string // 'youtube', 'twitter', etc.
}

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

export interface DownloadStats {
  totalDownloadedGB: number
  totalDownloads: number
  completedDownloads: number
  failedDownloads: number
  totalDownloadTime: number // milliseconds
  averageSpeed: number // bytes/sec
  platformStats: Record<string, { count: number; totalGB: number }>
}

export type NavView = 'downloads' | 'settings' | 'logs' | 'stats'

export const FORMAT_PRESETS: { label: string; value: string; description: string }[] = [
  {
    label: 'Best Quality',
    value: 'bestvideo+bestaudio/best',
    description: 'Highest available quality'
  },
  {
    label: '4K (2160p)',
    value: 'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
    description: 'Up to 4K resolution'
  },
  {
    label: '1080p HD',
    value: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
    description: 'Full HD'
  },
  {
    label: '720p HD',
    value: 'bestvideo[height<=720]+bestaudio/best[height<=720]',
    description: 'HD'
  },
  {
    label: '480p',
    value: 'bestvideo[height<=480]+bestaudio/best[height<=480]',
    description: 'Standard definition'
  },
  {
    label: '360p',
    value: 'bestvideo[height<=360]+bestaudio/best[height<=360]',
    description: 'Low quality'
  },
  {
    label: 'Audio Only (Best)',
    value: 'bestaudio/best',
    description: 'Best audio, no video'
  },
  {
    label: 'Audio Only (MP3)',
    value: 'bestaudio[ext=mp3]/bestaudio/best',
    description: 'MP3 audio'
  }
]

export type DownloadMode = 'video' | 'audio' | 'gallery'

export const AUDIO_FORMAT_PRESETS: { label: string; value: string; description: string }[] = [
  { label: 'MP3', value: 'mp3', description: 'Most compatible (needs ffmpeg)' },
  { label: 'M4A', value: 'm4a', description: 'High quality AAC' },
  { label: 'OPUS', value: 'opus', description: 'Best quality/size ratio' },
  { label: 'FLAC', value: 'flac', description: 'Lossless audio (needs ffmpeg)' }
]
