import { useStore } from '../../store/useStore'
import type { ViewKind } from '../../types'

const ITEMS: { view: ViewKind; label: string; icon: string }[] = [
  { view: 'path', label: 'Pfad', icon: '🗺️' },
  { view: 'practice', label: 'Übung', icon: '🎯' },
  { view: 'league', label: 'Liga', icon: '🏆' },
  { view: 'quests', label: 'Ziele', icon: '📋' },
  { view: 'profile', label: 'Profil', icon: '🦎' },
]

export default function BottomNav() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  return (
    <nav
      className="sticky bottom-0 z-30 flex items-center justify-around border-t px-1 py-1.5 lg:hidden"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
    >
      {ITEMS.map((item) => (
        <button
          key={item.view}
          onClick={() => setView(item.view)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-bold"
          style={{ color: view === item.view ? 'var(--primary-dark)' : 'var(--text-muted)' }}
        >
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
