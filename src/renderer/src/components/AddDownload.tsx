import { useState, useRef } from 'react'
import { Link, Loader2, Search, Download, ChevronDown, X, AlertCircle, Music, Film, Image, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoInfo, FORMAT_PRESETS, AUDIO_FORMAT_PRESETS, DownloadMode } from '../types'
import { useDownloadStore } from '../stores/useDownloadStore'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function isPlaylistUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname.toLowerCase()
    const search = urlObj.search.toLowerCase()
    
    // YouTube playlist
    if (hostname.includes('youtube.com') && search.includes('list=')) return true
    if (hostname.includes('youtu.be') && search.includes('list=')) return true
    
    // TikTok playlist/collection
    if (hostname.includes('tiktok.com') && (pathname.includes('/collection/') || pathname.includes('@'))) return true
    
    // Twitter/X thread/space
    if ((hostname.includes('twitter.com') || hostname.includes('x.com')) && pathname.includes('/i/spaces/')) return true
    
    // Instagram tagged posts (starts with @)
    if (hostname.includes('instagram.com') && pathname.startsWith('/@')) return true
    
    // Twitch channel/playlist
    if (hostname.includes('twitch.tv') && (pathname.includes('/collections/') || pathname.includes('/videos'))) return true
    
    // Reddit subreddit
    if (hostname.includes('reddit.com') && pathname.includes('/r/')) return true
    
    // Vimeo album
    if (hostname.includes('vimeo.com') && pathname.includes('/album/')) return true
    
    // Pixiv series
    if (hostname.includes('pixiv.net') && pathname.includes('/user/')) return true
    
    return false
  } catch {
    return false
  }
}

const MODE_TABS: { mode: DownloadMode; label: string; icon: any }[] = [
  { mode: 'video', label: 'Video', icon: Film },
  { mode: 'audio', label: 'Audio', icon: Music },
  { mode: 'gallery', label: 'Gallery', icon: Image }
]

export default function AddDownload() {
  const [url, setUrl] = useState('')
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [mode, setMode] = useState<DownloadMode>('video')
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_PRESETS[0])
  const [selectedAudioFormat, setSelectedAudioFormat] = useState(AUDIO_FORMAT_PRESETS[0])
  const [formatOpen, setFormatOpen] = useState(false)
  const [allowPlaylist, setAllowPlaylist] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addDownload, isDuplicate } = useDownloadStore()
  const isDuplicate_ = isDuplicate(url.trim())
  const isPlaylist = isPlaylistUrl(url.trim())

  const isValidUrl = (u: string) => {
    try { new URL(u); return true } catch { return false }
  }

  const handleFetch = async () => {
    if (!url.trim() || !isValidUrl(url.trim())) return
    setFetchState('loading')
    setFetchError('')
    setVideoInfo(null)
    const res = await window.api.fetchVideoInfo(url.trim())
    if (res.success) {
      setVideoInfo(res.data)
      setFetchState('ready')
    } else {
      setFetchError(res.error || 'Failed to fetch video info.')
      setFetchState('error')
    }
  }

  const handleDownload = async () => {
    const id = generateId()
    const title = videoInfo?.title || url
    addDownload({
      id,
      url: url.trim(),
      title,
      thumbnail: videoInfo?.thumbnail,
      status: 'downloading',
      progress: 0,
      format: mode === 'audio' ? selectedAudioFormat.value : selectedFormat.value,
      formatLabel: mode === 'audio' ? `Audio · ${selectedAudioFormat.label}` : selectedFormat.label,
      audioOnly: mode === 'audio',
      audioFormat: mode === 'audio' ? selectedAudioFormat.value : undefined,
      isPlaylist: isPlaylist && allowPlaylist,
      addedAt: Date.now(),
      extractor: videoInfo?.extractor_key
    })
    await window.api.startDownload({
      id,
      url: url.trim(),
      format: selectedFormat.value,
      title,
      thumbnail: videoInfo?.thumbnail,
      audioOnly: mode === 'audio',
      audioFormat: mode === 'audio' ? selectedAudioFormat.value : undefined,
      allowPlaylist: isPlaylist && allowPlaylist
    })
    setUrl('')
    setVideoInfo(null)
    setFetchState('idle')
    setAllowPlaylist(false)
  }

  const handleGalleryDownload = async () => {
    if (!url.trim() || !isValidUrl(url.trim())) return
    const id = generateId()
    addDownload({
      id,
      url: url.trim(),
      title: url.trim(),
      status: 'downloading',
      progress: 0,
      format: '',
      formatLabel: 'Gallery',
      useGalleryDl: true,
      addedAt: Date.now()
    })
    await window.api.startDownload({
      id,
      url: url.trim(),
      format: '',
      title: url.trim(),
      useGalleryDl: true
    })
    setUrl('')
  }

  const handleQuickDownload = async () => {
    if (!url.trim() || !isValidUrl(url.trim())) return
    const id = generateId()
    addDownload({
      id,
      url: url.trim(),
      title: url.trim(),
      status: 'fetching-info',
      progress: 0,
      format: mode === 'audio' ? selectedAudioFormat.value : selectedFormat.value,
      formatLabel: mode === 'audio' ? `Audio · ${selectedAudioFormat.label}` : selectedFormat.label,
      audioOnly: mode === 'audio',
      audioFormat: mode === 'audio' ? selectedAudioFormat.value : undefined,
      isPlaylist: isPlaylist && allowPlaylist,
      addedAt: Date.now()
    })
    await window.api.startDownload({
      id,
      url: url.trim(),
      format: selectedFormat.value,
      title: url.trim(),
      audioOnly: mode === 'audio',
      audioFormat: mode === 'audio' ? selectedAudioFormat.value : undefined,
      allowPlaylist: isPlaylist && allowPlaylist
    })
    setUrl('')
    setAllowPlaylist(false)
  }

  const handleReset = () => {
    setUrl('')
    setVideoInfo(null)
    setFetchState('idle')
    setFetchError('')
    inputRef.current?.focus()
  }

  const handleModeChange = (newMode: DownloadMode) => {
    setMode(newMode)
    setFetchState('idle')
    setVideoInfo(null)
    setFetchError('')
    setFormatOpen(false)
  }

  const currentPresets = mode === 'audio' ? AUDIO_FORMAT_PRESETS : FORMAT_PRESETS
  const currentSelected = mode === 'audio' ? selectedAudioFormat : selectedFormat
  const setCurrentSelected = (p: any) => {
    if (mode === 'audio') setSelectedAudioFormat(p)
    else setSelectedFormat(p)
  }

  return (
    <div className="px-6 pt-5 pb-4 border-b border-app-border bg-app-surface/50">
      {/* URL input */}
      <div className="flex items-center gap-2 bg-app-card border border-app-border rounded-xl px-3 py-2.5 focus-within:border-app-accent/60 focus-within:ring-2 focus-within:ring-app-accent/10 transition-all">
        <Link size={15} className="text-app-muted shrink-0" />
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (mode === 'gallery') {
                handleGalleryDownload()
              } else {
                handleFetch()
              }
            }
          }}
          placeholder={
            mode === 'gallery'
              ? 'Paste a gallery URL (DeviantArt, Pixiv, Danbooru, etc.)...'
              : 'Paste a video URL from YouTube, Twitter, TikTok, and 1000+ more...'
          }
          className="flex-1 bg-transparent text-sm text-app-text placeholder:text-app-muted outline-none min-w-0"
        />
        {url && (
          <button onClick={handleReset} className="text-app-muted hover:text-app-text shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Mode tabs + format + action */}
      <div className="flex items-center gap-2 mt-2">
        {/* Mode tabs */}
        <div className="flex items-center gap-0.5 bg-app-card border border-app-border rounded-xl p-1 shrink-0">
          {MODE_TABS.map(({ mode: m, label, icon: Icon }) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === m
                  ? 'bg-app-accent text-white'
                  : 'text-app-secondary hover:text-app-text'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Format selector — hidden in gallery mode */}
        {mode !== 'gallery' && (
          <div className="relative">
            <button
              onClick={() => setFormatOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 bg-app-card border border-app-border rounded-xl text-sm text-app-secondary hover:text-app-text hover:border-app-accent/40 transition-all whitespace-nowrap"
            >
              {currentSelected.label}
              <ChevronDown size={13} className={`transition-transform ${formatOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {formatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1.5 w-56 bg-app-card border border-app-border rounded-xl shadow-2xl shadow-black/40 z-50 py-1 overflow-hidden"
                >
                  {currentPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setCurrentSelected(preset)
                        setFormatOpen(false)
                      }}
                      className={`w-full flex flex-col items-start px-3 py-2 text-left hover:bg-white/5 transition-colors ${
                        currentSelected.value === preset.value ? 'text-app-accent' : 'text-app-text'
                      }`}
                    >
                      <span className="text-sm font-medium">{preset.label}</span>
                      <span className="text-[11px] text-app-muted">{preset.description}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex-1" />

        {/* Action button */}
        {mode === 'gallery' ? (
          <button
            onClick={handleGalleryDownload}
            disabled={!url.trim() || !isValidUrl(url.trim())}
            className="flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all"
          >
            <Download size={15} />
            Download Gallery
          </button>
        ) : (
          <button
            onClick={handleFetch}
            disabled={!url.trim() || !isValidUrl(url.trim()) || fetchState === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all"
          >
            {fetchState === 'loading' ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Search size={15} />
            )}
            Fetch Info
          </button>
        )}
      </div>

      {/* Preview card */}
      <AnimatePresence>
        {fetchState === 'ready' && videoInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 bg-app-card border border-app-border rounded-xl p-3">
              {videoInfo.thumbnail && (
                <img
                  src={videoInfo.thumbnail}
                  alt=""
                  className="w-24 h-14 object-cover rounded-lg shrink-0 bg-app-border"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-app-text line-clamp-2 leading-snug">
                  {videoInfo.title}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {videoInfo.uploader && (
                    <span className="text-[11px] text-app-muted">{videoInfo.uploader}</span>
                  )}
                  {videoInfo.duration && (
                    <span className="text-[11px] text-app-muted">
                      {formatDuration(videoInfo.duration)}
                    </span>
                  )}
                  {videoInfo.extractor_key && (
                    <span className="text-[11px] text-app-accent bg-app-accent/10 px-1.5 py-0.5 rounded-full">
                      {videoInfo.extractor_key}
                    </span>
                  )}
                  {mode === 'audio' && (
                    <span className="text-[11px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                      Audio only · {selectedAudioFormat.label}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-white text-sm font-medium rounded-lg transition-all shrink-0"
              >
                {mode === 'audio' ? <Music size={14} /> : <Download size={14} />}
                {mode === 'audio' ? `Save ${selectedAudioFormat.label}` : 'Download'}
              </button>
            </div>
            {isPlaylist && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5"
              >
                <input
                  type="checkbox"
                  checked={allowPlaylist}
                  onChange={(e) => setAllowPlaylist(e.target.checked)}
                  className="w-3.5 h-3.5 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-xs text-blue-400 font-medium flex items-center gap-1.5">
                    <List size={12} />
                    Download entire playlist ({videoInfo.length || '?'} items)
                  </p>
                </div>
              </motion.div>
            )}
            {isDuplicate_ && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5"
              >
                <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400 font-medium">This file has already been downloaded</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {fetchState === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-400 font-medium">Failed to fetch video info</p>
                <p className="text-[11px] text-red-400/70 mt-0.5 break-all">{fetchError}</p>
              </div>
              <button
                onClick={handleQuickDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-app-accent hover:bg-app-accent-hover text-white text-xs font-medium rounded-lg transition-all shrink-0"
              >
                <Download size={12} />
                Try anyway
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
