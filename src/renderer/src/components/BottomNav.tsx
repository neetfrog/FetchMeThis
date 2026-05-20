import { Download, Terminal, Settings, BarChart3 } from 'lucide-react'
import { NavView } from '../types'
import { useDownloadStore } from '../stores/useDownloadStore'

interface BottomNavProps {
  activeView: NavView
  onNavigate: (view: NavView) => void
}

export default function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  const activeCount = useDownloadStore((s) =>
    s.downloads.filter((d) => d.status === 'downloading' || d.status === 'queued').length
  )

  const navItems: { view: NavView; label: string; icon: any }[] = [
    { view: 'downloads', label: 'Downloads', icon: Download },
    { view: 'stats', label: 'Stats', icon: BarChart3 },
    { view: 'logs', label: 'Logs', icon: Terminal },
    { view: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <nav className="h-14 bg-app-surface border-t border-app-border flex items-center justify-center gap-1 shrink-0 px-4">
      <div className="flex items-center gap-1">
        {navItems.map(({ view, label, icon: Icon }) => {
          const isActive = activeView === view
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all relative ${
                isActive
                  ? 'bg-app-accent/15 text-app-accent'
                  : 'text-app-secondary hover:bg-white/5 hover:text-app-text'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
              {view === 'downloads' && activeCount > 0 && (
                <span className="ml-1 bg-app-accent text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {activeCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
