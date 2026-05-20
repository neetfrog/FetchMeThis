import { Terminal, Trash2 } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  message: string
}

interface LogsViewProps {
  logs: LogEntry[]
  onClear: () => void
}

export default function LogsView({ logs, onClear }: LogsViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface/50">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-app-muted" />
          <span className="text-sm font-medium text-app-text">Logs</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-app-border bg-app-card text-sm font-medium text-app-secondary hover:text-app-text hover:border-app-accent/40 transition-all"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 font-mono text-sm leading-6">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-app-muted">
            <span className="text-sm font-medium">No logs yet</span>
            <p className="text-sm">Start a download or install tool to see activity here.</p>
          </div>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex flex-wrap gap-2 text-app-text">
              <span className="text-xs text-app-muted min-w-[80px]">{entry.timestamp}</span>
              {entry.source ? <span className="text-xs text-app-muted">[{entry.source}]</span> : null}
              <span className="whitespace-pre-wrap break-words">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
