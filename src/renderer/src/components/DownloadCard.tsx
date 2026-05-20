import { useState } from 'react'
import { DownloadItem } from '../types'
import { X, CheckCircle2, AlertCircle, Loader2, FolderOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import ErrorModal from './ErrorModal'

interface DownloadCardProps {
  item: DownloadItem
  onCancel: (id: string) => void
  onRemove: (id: string) => void
  onOpenFolder: (id: string) => void
}

function formatEta(eta?: string): string {
  if (!eta || eta === 'Unknown') return ''
  return `ETA ${eta}`
}

export default function DownloadCard({ item, onCancel, onRemove, onOpenFolder }: DownloadCardProps) {
  const [showErrorModal, setShowErrorModal] = useState(false)
  const isActive = item.status === 'downloading' || item.status === 'fetching-info' || item.status === 'queued'
  const isComplete = item.status === 'completed'
  const isError = item.status === 'error'
  const isCancelled = item.status === 'cancelled'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 bg-app-card border border-app-border rounded-xl p-3 group"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-20 h-12 rounded-lg bg-app-border overflow-hidden">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 border border-app-muted/30 rounded" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-app-text line-clamp-1 leading-snug">
            {item.title !== item.url ? item.title : 'Fetching title...'}
          </p>

          {/* Status icon */}
          <div className="shrink-0 flex items-center justify-center w-4 h-4">
            {isActive && item.status !== 'fetching-info' && (
              <div className="w-4 h-4 rounded-full border-2 border-app-accent border-t-transparent animate-spin" />
            )}
            {item.status === 'fetching-info' && (
              <Loader2 size={16} className="text-app-muted animate-spin" />
            )}
            {isComplete && <CheckCircle2 size={16} className="text-app-success" />}
            {isError && <AlertCircle size={16} className="text-red-400" />}
            {isCancelled && <X size={16} className="text-app-muted" />}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-app-muted">{item.formatLabel}</span>
          {item.extractor && (
            <span className="text-[10px] text-app-accent/70 bg-app-accent/10 px-1.5 py-0.5 rounded-full">
              {item.extractor}
            </span>
          )}
          {isActive && item.speed && (
            <>
              <span className="text-[11px] text-app-muted">·</span>
              <span className="text-[11px] text-app-secondary">{item.speed}</span>
            </>
          )}
          {isActive && item.eta && (
            <>
              <span className="text-[11px] text-app-muted">·</span>
              <span className="text-[11px] text-app-muted">{formatEta(item.eta)}</span>
            </>
          )}
          {isActive && item.progress === -1 && item.size && (
            <>
              <span className="text-[11px] text-app-muted">·</span>
              <span className="text-[11px] text-app-secondary">{item.size}</span>
            </>
          )}
          {isComplete && item.size && (
            <span className="text-[11px] text-app-success/80">{item.size}</span>
          )}
          {isError && (
            <span
              onClick={() => setShowErrorModal(true)}
              className="text-[11px] text-red-400/80 break-words cursor-pointer hover:text-red-400 transition-colors"
              title="Click to see full error"
            >
              {item.error}
            </span>
          )}
          {isCancelled && (
            <span className="text-[11px] text-app-muted">Cancelled</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-app-border rounded-full overflow-hidden mt-2">
          {isActive && item.progress === -1 ? (
            <div className="h-full w-full rounded-full bg-app-accent animate-pulse" />
          ) : isActive ? (
            <div
              className="h-full rounded-full transition-all duration-300 relative bg-app-accent progress-shine"
              style={{ width: `${item.progress}%` }}
            />
          ) : isComplete ? (
            <div className="h-full w-full rounded-full bg-app-success" />
          ) : isError ? (
            <div className="h-full w-full rounded-full bg-red-500/50" />
          ) : (
            <div className="h-full rounded-full bg-app-accent/50" />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isComplete && (
          <button
            onClick={() => onOpenFolder(item.id)}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-white/5 transition-all"
            title="Open folder"
          >
            <FolderOpen size={14} />
          </button>
        )}
        {isActive && (
          <button
            onClick={() => onCancel(item.id)}
            className="p-1.5 rounded-lg text-app-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Cancel"
          >
            <X size={14} />
          </button>
        )}
        {(isCancelled || isError || isComplete) && (
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-white/5 transition-all"
            title="Remove"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        error={item.error || 'Unknown error'}
        title={item.title}
        onClose={() => setShowErrorModal(false)}
      />
    </motion.div>
  )
}
