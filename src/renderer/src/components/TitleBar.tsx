import { Minus, Square, X, Download } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.api.isMaximized().then(setMaximized)
  }, [])

  return (
    <div className="drag-region flex items-center h-10 bg-app-surface border-b border-app-border shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 shrink-0">
        <div className="w-6 h-6 bg-app-accent rounded-md flex items-center justify-center shrink-0">
          <Download size={13} className="text-white" />
        </div>
        <span className="font-semibold text-sm text-app-text tracking-wide">FetchMeThis</span>
      </div>

      {/* Drag area */}
      <div className="flex-1" />

      {/* Window controls */}
      <div className="no-drag flex items-center h-full">
        <button
          onClick={() => window.api.minimize()}
          className="flex items-center justify-center w-11 h-full text-app-muted hover:text-app-text hover:bg-white/5 transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => {
            window.api.maximize()
            setMaximized((m) => !m)
          }}
          className="flex items-center justify-center w-11 h-full text-app-muted hover:text-app-text hover:bg-white/5 transition-colors"
        >
          <Square size={12} className={maximized ? 'opacity-60' : ''} />
        </button>
        <button
          onClick={() => window.api.close()}
          className="flex items-center justify-center w-11 h-full text-app-muted hover:text-white hover:bg-red-500/80 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
