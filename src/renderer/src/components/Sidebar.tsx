import { Download, Settings, Terminal, Wifi } from 'lucide-react'
import { NavView } from '../types'
import { useDownloadStore } from '../stores/useDownloadStore'

interface SidebarProps {
  activeView: NavView
  onNavigate: (view: NavView) => void
}

const navItems: { view: NavView; label: string; icon: any }[] = [
  { view: 'downloads', label: 'Downloads', icon: Download },
  { view: 'logs', label: 'Logs', icon: Terminal },
  { view: 'settings', label: 'Settings', icon: Settings }
]

export default function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const downloads = useDownloadStore((s) => s.downloads)
  const activeCount = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'queued'
  ).length

  return (
    <aside className="w-[220px] shrink-0 bg-app-surface border-r border-app-border flex flex-col py-3">
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map(({ view, label, icon: Icon }) => {
          const isActive = activeView === view
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-app-accent/15 text-app-accent'
                  : 'text-app-secondary hover:bg-white/5 hover:text-app-text'
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {view === 'downloads' && activeCount > 0 && (
                <span className="ml-auto bg-app-accent text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {activeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Status footer */}
      <div className="px-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-app-card border border-app-border">
          <Wifi size={13} className="text-app-success shrink-0" />
          <span className="text-[11px] text-app-muted truncate">yt-dlp active</span>
        </div>
      </div>
    </aside>
  )
}
