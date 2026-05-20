import { useState, useEffect } from 'react'
import { Download, Loader2, CheckCircle2, AlertCircle, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface Tool {
  name: string
  key: 'yt-dlp' | 'ffmpeg' | 'gallery-dl'
  required: boolean
  installed: boolean
  checkFn: () => Promise<{ installed: boolean; available?: boolean }>
  installFn: () => Promise<{ success: boolean; error?: string }>
  progressFn: (cb: (msg: string) => void) => () => void
}

interface SetupScreenProps {
  onComplete: () => void
}

export default function SetupScreen({ onComplete }: SetupScreenProps) {
  const [tools, setTools] = useState<Tool[]>([])
  const [state, setState] = useState<'checking' | 'idle' | 'installing' | 'done' | 'error'>('checking')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [currentTool, setCurrentTool] = useState<string>('')

  // Initialize tools on mount
  useEffect(() => {
    const initTools = async () => {
      const toolList: Tool[] = [
        {
          name: 'yt-dlp',
          key: 'yt-dlp',
          required: true,
          installed: false,
          checkFn: () => window.api.checkYtDlp(),
          installFn: () => window.api.installYtDlp(),
          progressFn: (cb) => window.api.onYtDlpInstallProgress(cb)
        },
        {
          name: 'FFmpeg',
          key: 'ffmpeg',
          required: false,
          installed: false,
          checkFn: () => window.api.checkFfmpeg(),
          installFn: () => window.api.installFfmpeg(),
          progressFn: (cb) => window.api.onFfmpegInstallProgress(cb)
        },
        {
          name: 'gallery-dl',
          key: 'gallery-dl',
          required: false,
          installed: false,
          checkFn: () => window.api.checkGalleryDl(),
          installFn: () => window.api.installGalleryDl(),
          progressFn: (cb) => window.api.onGalleryDlInstallProgress(cb)
        }
      ]

      // Check status of all tools
      const updated = await Promise.all(
        toolList.map(async (tool) => {
          const result = await tool.checkFn()
          return {
            ...tool,
            installed: result.installed || result.available || false
          }
        })
      )

      setTools(updated)
      setState('idle')
    }

    initTools()
  }, [])

  const requiredMissing = tools.filter((t) => t.required && !t.installed)
  const optionalMissing = tools.filter((t) => !t.required && !t.installed)
  const totalMissing = requiredMissing.length + optionalMissing.length

  const handleInstallAll = async () => {
    setState('installing')
    
    // Install required tools first
    for (const tool of requiredMissing) {
      setCurrentTool(tool.name)
      setProgress(`Installing ${tool.name}...`)
      
      const unsubscribe = tool.progressFn((msg) => {
        setProgress(msg)
      })

      const res = await tool.installFn()
      unsubscribe()

      if (!res.success) {
        setState('error')
        setError(`Failed to install ${tool.name}: ${res.error || 'Unknown error'}`)
        return
      }

      // Update tool status
      setTools((prev) =>
        prev.map((t) => (t.key === tool.key ? { ...t, installed: true } : t))
      )
    }

    // Then install optional tools
    for (const tool of optionalMissing) {
      setCurrentTool(tool.name)
      setProgress(`Installing ${tool.name}...`)
      
      const unsubscribe = tool.progressFn((msg) => {
        setProgress(msg)
      })

      const res = await tool.installFn()
      unsubscribe()

      if (res.success) {
        setTools((prev) =>
          prev.map((t) => (t.key === tool.key ? { ...t, installed: true } : t))
        )
      }
      // Don't fail on optional tools, just skip them
    }

    setState('done')
    setTimeout(onComplete, 1200)
  }

  if (state === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8">
        <div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-app-secondary text-sm">Checking required tools...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Icon */}
        <div className="w-20 h-20 bg-app-accent/10 border border-app-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          {state === 'done' ? (
            <CheckCircle2 size={36} className="text-app-success" />
          ) : state === 'error' ? (
            <AlertCircle size={36} className="text-red-400" />
          ) : (
            <Download size={36} className="text-app-accent" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-app-text mb-2 text-center">
          {state === 'done' ? 'Ready to go!' : state === 'error' ? 'Setup failed' : 'Setup required'}
        </h1>

        <p className="text-app-secondary text-sm text-center leading-relaxed mb-6">
          {state === 'idle' &&
            'FetchMeThis needs to download some tools to work. You can skip optional tools if you prefer.'}
          {state === 'installing' && `Installing ${currentTool}...\n${progress}`}
          {state === 'done' && 'All tools installed successfully. Launching FetchMeThis...'}
          {state === 'error' && error}
        </p>

        {/* Tool Checklist */}
        {state !== 'installing' && state !== 'done' && (
          <div className="space-y-3 mb-6">
            {tools.map((tool) => (
              <div
                key={tool.key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  tool.installed
                    ? 'bg-app-success/10 border-app-success/30'
                    : 'bg-app-secondary/5 border-app-secondary/20'
                }`}
              >
                {tool.installed ? (
                  <Check size={18} className="text-app-success flex-shrink-0" />
                ) : (
                  <X size={18} className="text-app-muted flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-app-text">
                    {tool.name}
                    {tool.required && <span className="text-red-400 ml-1">*</span>}
                  </p>
                  <p className="text-xs text-app-muted">
                    {tool.installed ? 'Installed' : 'Not installed'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {state === 'installing' && (
          <div className="flex items-center justify-center gap-2 text-app-muted text-sm mb-6">
            <Loader2 size={16} className="animate-spin" />
            Downloading...
          </div>
        )}

        {(state === 'idle' || state === 'error') && totalMissing > 0 && (
          <div className="flex flex-col gap-2">
            {requiredMissing.length > 0 && (
              <p className="text-xs text-app-muted">* Required tools</p>
            )}
            <button
              onClick={handleInstallAll}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-app-accent hover:bg-app-accent-hover text-white font-semibold rounded-xl transition-all"
            >
              <Download size={18} />
              {state === 'error' ? 'Retry' : `Install ${totalMissing} Tool${totalMissing !== 1 ? 's' : ''}`}
            </button>
            <p className="text-[11px] text-app-muted text-center">
              Downloads to your app data folder. No system-wide install required.
            </p>
          </div>
        )}

        {state === 'idle' && totalMissing === 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-app-success">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">All tools are installed</span>
            </div>
            <button
              onClick={onComplete}
              className="w-full px-6 py-3 bg-app-accent hover:bg-app-accent-hover text-white font-semibold rounded-xl transition-all"
            >
              Continue
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
