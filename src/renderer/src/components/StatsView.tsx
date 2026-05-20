import { useEffect, useState } from 'react'
import { TrendingUp, HardDrive, Zap, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import { useDownloadStore } from '../stores/useDownloadStore'
import { DownloadStats } from '../types'

export default function StatsView() {
  const { getStats, downloads } = useDownloadStore()
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [speedHistory, setSpeedHistory] = useState<number[]>([])

  useEffect(() => {
    const updateStats = () => {
      setStats(getStats())
    }

    updateStats()

    // Update stats when downloads change
    const unsub = useDownloadStore.subscribe(
      () => updateStats()
    )

    return unsub
  }, [getStats])

  // Collect speed history from all downloads
  useEffect(() => {
    const allSpeeds: number[] = []
    downloads.forEach((d) => {
      if (d.speedHistory) {
        allSpeeds.push(...d.speedHistory)
      }
    })
    setSpeedHistory(allSpeeds.slice(-100)) // Keep last 100 samples
  }, [downloads])

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completionRate =
    stats.totalDownloads > 0
      ? ((stats.completedDownloads / stats.totalDownloads) * 100).toFixed(1)
      : '0'

  const avgSpeedMbps = (stats.averageSpeed / 1024 / 1024).toFixed(2)
  const avgDownloadTime = stats.completedDownloads > 0
    ? (stats.totalDownloadTime / stats.completedDownloads / 1000 / 60).toFixed(1)
    : '0'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-app-border bg-app-surface/50 shrink-0">
        <TrendingUp size={16} className="text-app-muted" />
        <span className="text-sm font-medium text-app-text">Download Statistics</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-6 pb-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Downloaded */}
            <div className="bg-app-card border border-app-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">
                  Total Downloaded
                </span>
                <HardDrive size={14} className="text-app-muted" />
              </div>
              <p className="text-2xl font-bold text-app-accent">
                {stats.totalDownloadedGB.toFixed(2)}
                <span className="text-sm font-normal text-app-muted ml-1">GB</span>
              </p>
              <p className="text-xs text-app-muted mt-2">
                {stats.completedDownloads} files completed
              </p>
            </div>

            {/* Average Speed */}
            <div className="bg-app-card border border-app-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">
                  Average Speed
                </span>
                <Zap size={14} className="text-app-muted" />
              </div>
              <p className="text-2xl font-bold text-app-accent">
                {avgSpeedMbps}
                <span className="text-sm font-normal text-app-muted ml-1">MB/s</span>
              </p>
              <p className="text-xs text-app-muted mt-2">
                Based on {downloads.filter((d) => d.speedHistory?.length).length} monitored downloads
              </p>
            </div>

            {/* Completion Rate */}
            <div className="bg-app-card border border-app-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">
                  Completion Rate
                </span>
                <CheckCircle2 size={14} className="text-app-success" />
              </div>
              <p className="text-2xl font-bold text-app-accent">
                {completionRate}
                <span className="text-sm font-normal text-app-muted ml-1">%</span>
              </p>
              <p className="text-xs text-app-muted mt-2">
                {stats.completedDownloads} of {stats.totalDownloads} successful
              </p>
            </div>

            {/* Average Duration */}
            <div className="bg-app-card border border-app-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">
                  Avg Duration
                </span>
                <Download size={14} className="text-app-muted" />
              </div>
              <p className="text-2xl font-bold text-app-accent">
                {avgDownloadTime}
                <span className="text-sm font-normal text-app-muted ml-1">min</span>
              </p>
              <p className="text-xs text-app-muted mt-2">
                Per completed download
              </p>
            </div>
          </div>

          {/* Platform Statistics */}
          {Object.keys(stats.platformStats).length > 0 && (
            <div className="bg-app-card border border-app-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-4">
                Downloads by Platform
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.platformStats)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([platform, data]) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-app-text capitalize">{platform}</p>
                        <p className="text-xs text-app-muted">{data.count} downloads</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-app-accent">
                          {data.totalGB.toFixed(2)} GB
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Failed Downloads */}
          {stats.failedDownloads > 0 && (
            <div className="bg-app-card border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-red-400" />
                <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                  Failed Downloads
                </h3>
              </div>
              <p className="text-sm text-app-text">
                {stats.failedDownloads} download{stats.failedDownloads !== 1 ? 's' : ''} failed
              </p>
              <p className="text-xs text-app-muted mt-1">
                Check Logs view for error details
              </p>
            </div>
          )}

          {/* Speed Graph */}
          {speedHistory.length > 1 && (
            <div className="bg-app-card border border-app-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-4">
                Download Speed History
              </h3>
              <SpeedGraph speeds={speedHistory} />
            </div>
          )}

          {/* Empty State */}
          {stats.totalDownloads === 0 && (
            <div className="bg-app-surface/50 border border-dashed border-app-border rounded-xl p-8 text-center">
              <Download size={32} className="text-app-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm text-app-muted">No downloads yet</p>
              <p className="text-xs text-app-muted mt-1">
                Start downloading files to see statistics
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple bar chart component for speed visualization
function SpeedGraph({ speeds }: { speeds: number[] }) {
  if (speeds.length < 2) return null

  const maxSpeed = Math.max(...speeds)
  const minSpeed = Math.min(...speeds)
  const range = maxSpeed - minSpeed || 1

  const chartHeight = 120
  const barWidth = Math.max(2, 100 / speeds.length)

  return (
    <div className="flex items-end justify-center gap-0.5" style={{ height: `${chartHeight}px` }}>
      {speeds.map((speed, idx) => {
        const normalized = (speed - minSpeed) / range
        const height = Math.max(2, normalized * chartHeight)
        const mbps = (speed / 1024 / 1024).toFixed(1)

        return (
          <div
            key={idx}
            className="bg-gradient-to-t from-app-accent/80 to-app-accent hover:from-app-accent hover:to-app-accent/60 rounded-sm transition-all group relative"
            style={{ width: `${barWidth}%`, height: `${height}px` }}
            title={`${mbps} MB/s`}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-app-bg border border-app-border rounded px-2 py-1 text-xs text-app-text whitespace-nowrap pointer-events-none z-10">
              {mbps} MB/s
            </div>
          </div>
        )
      })}
    </div>
  )
}
