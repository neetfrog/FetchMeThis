import { AnimatePresence, motion } from 'framer-motion'
import { useDownloadStore } from '../stores/useDownloadStore'
import AddDownload from './AddDownload'
import DownloadCard from './DownloadCard'
import { Download, Inbox, History, Trash2, Search } from 'lucide-react'
import { useState } from 'react'

export default function DownloadsView() {
  const downloads = useDownloadStore((s) => s.downloads)
  const searchQuery = useDownloadStore((s) => s.searchQuery)
  const setSearchQuery = useDownloadStore((s) => s.setSearchQuery)
  const searchResults = useDownloadStore((s) => s.searchResults())
  const removeDownload = useDownloadStore((s) => s.removeDownload)
  const clearHistory = useDownloadStore((s) => s.clearHistory)

  // Use search results if searching, otherwise use full list
  const displayDownloads = searchQuery.trim() ? searchResults : downloads

  const activeDownloads = displayDownloads.filter(
    (d) => d.status !== 'completed' && d.status !== 'error' && d.status !== 'cancelled'
  )

  const historyDownloads = displayDownloads.filter(
    (d) => d.status === 'completed' || d.status === 'error' || d.status === 'cancelled'
  )

  const handleCancel = async (id: string) => {
    await window.api.cancelDownload(id)
  }

  const handleRemove = (id: string) => {
    removeDownload(id)
  }

  const handleOpenFolder = async (id: string) => {
    const item = downloads.find((d) => d.id === id)
    if (item?.filePath) {
      await window.api.openFile(item.filePath)
    } else {
      const settings = await window.api.getSettings()
      await window.api.openFolder(settings.downloadPath)
    }
  }

  const isEmpty = activeDownloads.length === 0 && historyDownloads.length === 0

  return (
    <div className="flex flex-col h-full">
      <AddDownload />

      {/* Search Bar */}
      <div className="px-6 py-3 border-b border-app-border bg-app-surface/30 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search downloads by title, URL, uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-surface border border-app-border rounded-lg pl-10 pr-4 py-2 text-sm text-app-text outline-none focus:border-app-accent/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="px-6 py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-app-card border border-app-border flex items-center justify-center">
                <Inbox size={28} className="text-app-muted" />
              </div>
              <div>
                <p className="text-app-secondary font-medium">No downloads yet</p>
                <p className="text-app-muted text-sm mt-1">Paste a URL above to get started</p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-4">
            {/* Active Downloads */}
            {activeDownloads.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Download size={14} className="text-app-accent" />
                  <span className="text-xs font-semibold text-app-text uppercase tracking-wider">
                    Active — {activeDownloads.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {activeDownloads.map((item) => (
                      <DownloadCard
                        key={item.id}
                        item={item}
                        onCancel={handleCancel}
                        onRemove={handleRemove}
                        onOpenFolder={handleOpenFolder}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Divider */}
            {activeDownloads.length > 0 && historyDownloads.length > 0 && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gradient-to-r from-app-border to-transparent" />
                <span className="text-xs text-app-muted">History</span>
                <div className="flex-1 h-px bg-gradient-to-l from-app-border to-transparent" />
              </div>
            )}

            {/* History */}
            {historyDownloads.length > 0 && (
              <div>
                {activeDownloads.length === 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History size={14} className="text-app-muted" />
                      <span className="text-xs font-semibold text-app-text uppercase tracking-wider">
                        History — {historyDownloads.length}
                      </span>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1.5 text-xs text-app-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                      Clear
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {historyDownloads.map((item) => (
                      <DownloadCard
                        key={item.id}
                        item={item}
                        onCancel={() => {}}
                        onRemove={handleRemove}
                        onOpenFolder={handleOpenFolder}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
