import { create } from 'zustand'
import { DownloadItem, DownloadStatus, DownloadStats } from '../types'

interface DownloadStore {
  downloads: DownloadItem[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  addDownload: (item: DownloadItem) => void
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void
  removeDownload: (id: string) => void
  clearHistory: () => void
  activeDownloads: () => DownloadItem[]
  historyDownloads: () => DownloadItem[]
  searchResults: () => DownloadItem[]
  isDuplicate: (url: string) => boolean
  getStats: () => DownloadStats
}

const HISTORY_KEY = 'fetchmethis_history'
const LEGACY_HISTORY_KEY = 'viddown_history'

function loadHistory(): DownloadItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY) ?? localStorage.getItem(LEGACY_HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveHistory(items: DownloadItem[]): void {
  const history = items.filter((d) => d.status === 'completed' || d.status === 'error')
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 500)))
}

const TERMINAL_STATUSES: DownloadStatus[] = ['completed', 'error', 'cancelled']

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: loadHistory(),
  searchQuery: '',

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  addDownload: (item) => {
    set((state) => ({ downloads: [item, ...state.downloads] }))
  },

  updateDownload: (id, updates) => {
    set((state) => {
      const downloads = state.downloads.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      )
      saveHistory(downloads)
      return { downloads }
    })
  },

  removeDownload: (id) => {
    set((state) => {
      const downloads = state.downloads.filter((d) => d.id !== id)
      saveHistory(downloads)
      return { downloads }
    })
  },

  clearHistory: () => {
    set((state) => {
      const active = state.downloads.filter((d) => !TERMINAL_STATUSES.includes(d.status))
      saveHistory([])
      return { downloads: active }
    })
  },

  activeDownloads: () => {
    return get().downloads.filter((d) => !TERMINAL_STATUSES.includes(d.status))
  },

  historyDownloads: () => {
    return get().downloads.filter((d) => TERMINAL_STATUSES.includes(d.status))
  },

  searchResults: () => {
    const { downloads, searchQuery } = get()
    if (!searchQuery.trim()) return downloads
    
    const query = searchQuery.toLowerCase()
    return downloads.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.url.toLowerCase().includes(query) ||
        d.uploader?.toLowerCase().includes(query) ||
        d.platform?.toLowerCase().includes(query)
    )
  },

  isDuplicate: (url: string) => {
    return get().downloads.some((d) => d.url === url && d.status === 'completed')
  },

  getStats: (): DownloadStats => {
    const downloads = get().downloads
    const completed = downloads.filter((d) => d.status === 'completed')
    const failed = downloads.filter((d) => d.status === 'error')
    
    let totalBytes = 0
    let totalTime = 0
    let totalSpeeds: number[] = []
    const platformMap: Record<string, { count: number; totalGB: number }> = {}
    
    completed.forEach((d) => {
      const bytes = d.totalBytes || 0
      totalBytes += bytes
      totalTime += (d.completedAt || 0) - d.addedAt
      
      if (d.speedHistory?.length) {
        totalSpeeds.push(...d.speedHistory)
      }
      
      const platform = d.platform || 'unknown'
      if (!platformMap[platform]) {
        platformMap[platform] = { count: 0, totalGB: 0 }
      }
      platformMap[platform].count += 1
      platformMap[platform].totalGB += bytes / 1024 / 1024 / 1024
    })
    
    return {
      totalDownloadedGB: totalBytes / 1024 / 1024 / 1024,
      totalDownloads: downloads.length,
      completedDownloads: completed.length,
      failedDownloads: failed.length,
      totalDownloadTime: totalTime,
      averageSpeed: totalSpeeds.length ? totalSpeeds.reduce((a, b) => a + b) / totalSpeeds.length : 0,
      platformStats: platformMap
    }
  }
}))
