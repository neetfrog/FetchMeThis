import { useEffect, useState } from 'react'
import TitleBar from './components/TitleBar'
import BottomNav from './components/BottomNav'
import DownloadsView from './components/DownloadsView'
import SettingsView from './components/SettingsView'
import SetupScreen from './components/SetupScreen'
import LogsView from './components/LogsView'
import StatsView from './components/StatsView'
import ContextMenu from './components/ContextMenu'
import { useDownloadStore } from './stores/useDownloadStore'
import { NavView } from './types'
import { Copy, Scissors, Clipboard, SquareCheckBig } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  message: string
  source?: string
}

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('downloads')
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [inputContextMenu, setInputContextMenu] = useState({ isOpen: false, x: 0, y: 0, element: null as HTMLElement | null })
  const { updateDownload, downloads } = useDownloadStore()

  // Check if required tools are installed on startup
  useEffect(() => {
    const checkTools = async () => {
      const ytdlpRes = await window.api.checkYtDlp()
      // Setup is required if yt-dlp (required tool) is not installed
      setSetupRequired(!ytdlpRes.installed)
    }
    
    checkTools()
  }, [])

  // Enable context menu for input fields
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Show custom context menu for input, textarea, and contenteditable elements
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.contentEditable === 'true'
      ) {
        e.preventDefault()
        setInputContextMenu({
          isOpen: true,
          x: e.clientX,
          y: e.clientY,
          element: target
        })
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  // Wire up download event listeners
  useEffect(() => {
    const pushLog = (message: string, source?: string) => {
      setLogs((current) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toLocaleTimeString(),
          message,
          source
        },
        ...current
      ].slice(0, 200))
    }

    const offProgress = window.api.onDownloadProgress((data: any) => {
      // Build speed history array
      const currentDownload = downloads.find((d) => d.id === data.id)
      const speedHistory = currentDownload?.speedHistory || []
      if (data.speedBytes) {
        speedHistory.push(data.speedBytes)
        // Keep last 100 samples
        if (speedHistory.length > 100) {
          speedHistory.shift()
        }
      }

      updateDownload(data.id, {
        progress: data.percent,
        speed: data.speed,
        eta: data.eta,
        size: data.size,
        downloadedBytes: data.downloadedBytes,
        totalBytes: data.totalBytes,
        speedHistory,
        status: 'downloading'
      })

      const progressText = Number.isFinite(data.percent)
        ? `${data.percent.toFixed(1)}% ${data.size || ''} ${data.speed || ''} ETA ${data.eta || ''}`.trim()
        : `${data.size || ''}`.trim()
      pushLog(`Download ${data.id}: ${progressText}`)
    })

    const offComplete = window.api.onDownloadComplete((data: any) => {
      updateDownload(data.id, {
        status: 'completed',
        progress: 100,
        completedAt: Date.now(),
        speed: undefined,
        eta: undefined
      })
      pushLog(`Download ${data.id} completed`)
    })

    const offError = window.api.onDownloadError((data: any) => {
      updateDownload(data.id, {
        status: 'error',
        error: data.error,
        speed: undefined,
        eta: undefined
      })
      pushLog(`Download ${data.id} failed: ${data.error}`)
    })

    const offCancelled = window.api.onDownloadCancelled((data: any) => {
      updateDownload(data.id, {
        status: 'cancelled',
        speed: undefined,
        eta: undefined
      })
      pushLog(`Download ${data.id} cancelled`)
    })

    const offOutput = window.api.onDownloadOutput((data: any) => {
      pushLog(data.message, data.source)
    })

    const offYtDlpProgress = window.api.onYtDlpInstallProgress((msg: string) => {
      pushLog(`yt-dlp: ${msg}`)
    })

    const offFfmpegProgress = window.api.onFfmpegInstallProgress((msg: string) => {
      pushLog(`ffmpeg: ${msg}`)
    })

    const offGalleryDlProgress = window.api.onGalleryDlInstallProgress((msg: string) => {
      pushLog(`gallery-dl: ${msg}`)
    })

    return () => {
      offProgress()
      offComplete()
      offError()
      offCancelled()
      offOutput()
      offYtDlpProgress()
      offFfmpegProgress()
      offGalleryDlProgress()
    }
  }, [updateDownload])

  if (setupRequired === null) {
    return (
      <div className="flex h-screen bg-app-bg items-center justify-center">
        <div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (setupRequired) {
    return (
      <div className="flex flex-col h-screen bg-app-bg text-app-text">
        <TitleBar />
        <SetupScreen onComplete={() => setSetupRequired(false)} />
      </div>
    )
  }

  const inputContextMenuOptions = [
    {
      label: 'Paste',
      icon: <Clipboard size={14} />,
      onClick: () => {
        if (inputContextMenu.element instanceof HTMLInputElement || inputContextMenu.element instanceof HTMLTextAreaElement) {
          document.execCommand('paste')
        }
      }
    },
    {
      label: 'Select All',
      icon: <SquareCheckBig size={14} />,
      onClick: () => {
        if (inputContextMenu.element instanceof HTMLInputElement || inputContextMenu.element instanceof HTMLTextAreaElement) {
          document.execCommand('selectAll')
        }
      }
    },
    {
      label: 'Cut',
      icon: <Scissors size={14} />,
      onClick: () => {
        if (inputContextMenu.element instanceof HTMLInputElement || inputContextMenu.element instanceof HTMLTextAreaElement) {
          document.execCommand('cut')
        }
      }
    },
    {
      label: 'Copy',
      icon: <Copy size={14} />,
      onClick: () => {
        if (inputContextMenu.element instanceof HTMLInputElement || inputContextMenu.element instanceof HTMLTextAreaElement) {
          document.execCommand('copy')
        }
      }
    }
  ]

  return (
    <div className="flex flex-col h-screen bg-app-bg text-app-text">
      <TitleBar />
      <main className="flex-1 overflow-hidden">
        {activeView === 'downloads' && <DownloadsView />}
        {activeView === 'stats' && <StatsView />}
        {activeView === 'logs' && <LogsView logs={logs} onClear={() => setLogs([])} />}
        {activeView === 'settings' && <SettingsView />}
      </main>
      <BottomNav activeView={activeView} onNavigate={setActiveView} />
      
      <ContextMenu
        isOpen={inputContextMenu.isOpen}
        x={inputContextMenu.x}
        y={inputContextMenu.y}
        options={inputContextMenuOptions}
        onClose={() => setInputContextMenu({ ...inputContextMenu, isOpen: false })}
      />
    </div>
  )
}
