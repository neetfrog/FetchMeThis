import { useEffect, useState } from 'react'
import { Folder, Save, Settings, RotateCcw, CheckCircle2, AlertCircle, Loader2, Wrench, Download } from 'lucide-react'
import { AppSettings, FORMAT_PRESETS } from '../types'
import { motion } from 'framer-motion'

export default function SettingsView() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [ffmpegStatus, setFfmpegStatus] = useState<{ available: boolean; path: string } | null>(null)
  const [galleryDlStatus, setGalleryDlStatus] = useState<{ installed: boolean; path: string } | null>(null)
  const [ffmpegInstalling, setFfmpegInstalling] = useState(false)
  const [galleryDlInstalling, setGalleryDlInstalling] = useState(false)
  const [ffmpegProgress, setFfmpegProgress] = useState('')
  const [galleryDlProgress, setGalleryDlProgress] = useState('')
  const [ffmpegError, setFfmpegError] = useState('')
  const [galleryDlError, setGalleryDlError] = useState('')

  useEffect(() => {
    window.api.getSettings().then(setSettings)
  }, [])

  useEffect(() => {
    window.api.checkFfmpeg().then(setFfmpegStatus)
    window.api.checkGalleryDl().then(setGalleryDlStatus)
  }, [])

  const update = (patch: Partial<AppSettings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s))
  }

  const handleSave = async () => {
    if (!settings) return
    await window.api.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    window.api.checkFfmpeg().then(setFfmpegStatus)
    window.api.checkGalleryDl().then(setGalleryDlStatus)
  }

  const handleChooseDir = async () => {
    const dir = await window.api.chooseDirectory()
    if (dir) update({ downloadPath: dir })
  }

  const handleReset = async () => {
    const defaultPath = await window.api.getDefaultDownloadPath()
    update({ downloadPath: defaultPath })
  }

  const handleInstallFfmpeg = async () => {
    setFfmpegInstalling(true)
    setFfmpegError('')
    setFfmpegProgress('Starting...')
    const off = window.api.onFfmpegInstallProgress(setFfmpegProgress)
    const res = await window.api.installFfmpeg()
    off()
    setFfmpegInstalling(false)
    if (res.success) {
      window.api.checkFfmpeg().then(setFfmpegStatus)
    } else {
      setFfmpegError(res.error || 'Installation failed')
    }
  }

  const handleInstallGalleryDl = async () => {
    setGalleryDlInstalling(true)
    setGalleryDlError('')
    setGalleryDlProgress('Starting...')
    const off = window.api.onGalleryDlInstallProgress(setGalleryDlProgress)
    const res = await window.api.installGalleryDl()
    off()
    setGalleryDlInstalling(false)
    if (res.success) {
      window.api.checkGalleryDl().then(setGalleryDlStatus)
    } else {
      setGalleryDlError(res.error || 'Installation failed')
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-app-border bg-app-surface/50">
        <Settings size={16} className="text-app-muted" />
        <span className="text-sm font-medium text-app-text">Settings</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          <div className="lg:col-span-2 space-y-6">

          {/* Download Location */}
          <section>
            <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-3">
              Downloads
            </h3>
            <div className="bg-app-card border border-app-border rounded-xl overflow-hidden">
              <div className="p-4">
                <label className="block text-sm font-medium text-app-text mb-2">
                  Download folder
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.downloadPath}
                    onChange={(e) => update({ downloadPath: e.target.value })}
                    className="flex-1 bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent/60 transition-colors"
                  />
                  <button
                    onClick={handleChooseDir}
                    className="flex items-center gap-2 px-3 py-2 bg-app-surface border border-app-border rounded-lg text-sm text-app-secondary hover:text-app-text hover:border-app-accent/40 transition-all"
                  >
                    <Folder size={14} />
                    Browse
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 bg-app-surface border border-app-border rounded-lg text-app-muted hover:text-app-text transition-all"
                    title="Reset to default"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              <div className="border-t border-app-border p-4">
                <label className="block text-sm font-medium text-app-text mb-2">
                  Concurrent downloads
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => update({ maxConcurrentDownloads: n })}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-all ${
                        settings.maxConcurrentDownloads === n
                          ? 'bg-app-accent border-app-accent text-white'
                          : 'bg-app-surface border-app-border text-app-secondary hover:border-app-accent/40 hover:text-app-text'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          </div>

          {/* Quality & Output in 2-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-6 lg:space-y-0">
            {/* Quality */}
            <section>
              <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-3">
                Quality
              </h3>
              <div className="bg-app-card border border-app-border rounded-xl p-4">
                <label className="block text-sm font-medium text-app-text mb-2">
                  Default format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FORMAT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => update({ defaultFormat: preset.value })}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all ${
                      settings.defaultFormat === preset.value
                        ? 'bg-app-accent/10 border-app-accent/40 text-app-accent'
                        : 'bg-app-surface border-app-border text-app-secondary hover:border-app-accent/30 hover:text-app-text'
                    }`}
                  >
                    <span className="text-sm font-medium">{preset.label}</span>
                    <span className="text-[11px] text-app-muted mt-0.5">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

            {/* Metadata/Output */}
            <section>
              <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-3">
                Output
              </h3>
              <div className="bg-app-card border border-app-border rounded-xl overflow-hidden divide-y divide-app-border">
                <ToggleRow
                  label="Embed thumbnail"
                  description="Add video thumbnail as cover art"
                  value={settings.embedThumbnail}
                  onChange={(v) => update({ embedThumbnail: v })}
                />
                <ToggleRow
                  label="Add metadata"
                  description="Embed title, artist, and other metadata"
                  value={settings.addMetadata}
                  onChange={(v) => update({ addMetadata: v })}
                />
              </div>
            </section>
          </div>

          {/* Tools - full width */}
          <section>
            <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wrench size={12} />
              Tools
            </h3>
            <div className="bg-app-card border border-app-border rounded-xl overflow-hidden divide-y divide-app-border">

              {/* yt-dlp */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-app-text">yt-dlp</p>
                    <p className="text-[11px] text-app-muted mt-0.5">Video downloader — required</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-app-success">
                    <CheckCircle2 size={13} />
                    Installed
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-app-muted mb-1">Custom binary path</label>
                  <input
                    type="text"
                    value={settings.ytdlpCustomPath}
                    onChange={(e) => update({ ytdlpCustomPath: e.target.value })}
                    placeholder="Leave blank to use built-in"
                    className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent/60 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* ffmpeg */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-app-text">ffmpeg</p>
                    <p className="text-[11px] text-app-muted mt-0.5">Audio conversion &amp; video merging</p>
                  </div>
                  {ffmpegStatus === null ? (
                    <span className="text-xs text-app-muted">Checking...</span>
                  ) : ffmpegStatus.available ? (
                    <span className="flex items-center gap-1.5 text-xs text-app-success">
                      <CheckCircle2 size={13} />
                      Found
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <AlertCircle size={13} />
                      Not found
                    </span>
                  )}
                </div>
                {ffmpegStatus?.available && ffmpegStatus.path && (
                  <p className="text-[11px] text-app-muted font-mono truncate">&darr; {ffmpegStatus.path}</p>
                )}
                <div>
                  <label className="block text-xs text-app-muted mb-1">Custom binary path</label>
                  <input
                    type="text"
                    value={settings.ffmpegCustomPath}
                    onChange={(e) => update({ ffmpegCustomPath: e.target.value })}
                    placeholder="e.g. C:\ffmpeg\bin\ffmpeg.exe"
                    className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent/60 transition-colors font-mono"
                  />
                </div>
                {!ffmpegStatus?.available && (
                  ffmpegInstalling ? (
                    <div className="flex items-center gap-2 text-app-muted">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">{ffmpegProgress}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={handleInstallFfmpeg}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-app-accent hover:bg-app-accent-hover text-white text-xs font-medium rounded-lg transition-all"
                      >
                        <Download size={12} />
                        Auto-install (Windows only)
                      </button>
                      {ffmpegError && <p className="text-[11px] text-red-400">{ffmpegError}</p>}
                    </div>
                  )
                )}
              </div>

              {/* gallery-dl */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-app-text">gallery-dl</p>
                    <p className="text-[11px] text-app-muted mt-0.5">Gallery &amp; image board downloader</p>
                  </div>
                  {galleryDlStatus === null ? (
                    <span className="text-xs text-app-muted">Checking...</span>
                  ) : galleryDlStatus.installed ? (
                    <span className="flex items-center gap-1.5 text-xs text-app-success">
                      <CheckCircle2 size={13} />
                      Installed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <AlertCircle size={13} />
                      Not installed
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-app-muted mb-1">Custom binary path</label>
                  <input
                    type="text"
                    value={settings.galleryDlCustomPath}
                    onChange={(e) => update({ galleryDlCustomPath: e.target.value })}
                    placeholder="Leave blank to use built-in or system PATH"
                    className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent/60 transition-colors font-mono"
                  />
                </div>
                {!galleryDlStatus?.installed && (
                  galleryDlInstalling ? (
                    <div className="flex items-center gap-2 text-app-muted">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">{galleryDlProgress}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={handleInstallGalleryDl}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-app-accent hover:bg-app-accent-hover text-white text-xs font-medium rounded-lg transition-all"
                      >
                        <Download size={12} />
                        Install gallery-dl (Win / Linux)
                      </button>
                      {galleryDlError && <p className="text-[11px] text-red-400">{galleryDlError}</p>}
                    </div>
                  )
                )}
              </div>

            </div>
          </section>
        </div>
      </div>

      {/* Save bar */}
      <div className="px-6 py-3 border-t border-app-border bg-app-surface/50 flex justify-end">
        <motion.button
          onClick={handleSave}
          animate={saved ? { backgroundColor: '#10b981' } : {}}
          className="flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save changes'}
        </motion.button>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  value,
  onChange
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/2"
      onClick={() => onChange(!value)}
    >
      <div>
        <p className="text-sm font-medium text-app-text">{label}</p>
        <p className="text-[11px] text-app-muted mt-0.5">{description}</p>
      </div>
      <div
        className={`w-9 h-5 rounded-full transition-colors shrink-0 ${
          value ? 'bg-app-accent' : 'bg-app-border'
        }`}
      >
        <div
          className={`w-3.5 h-3.5 bg-white rounded-full mt-[3px] transition-all ${
            value ? 'ml-[19px]' : 'ml-[3px]'
          }`}
        />
      </div>
    </div>
  )
}
