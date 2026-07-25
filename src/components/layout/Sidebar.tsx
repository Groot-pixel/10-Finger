import { useStore } from '../../store/useStore'
import type { ViewKind } from '../../types'

const ITEMS: { view: ViewKind; label: string; icon: string }[] = [
  { view: 'path', label: 'Lernpfad', icon: '🗺️' },
  { view: 'practice', label: 'Practice Hub', icon: '🎯' },
  { view: 'league', label: 'Liga', icon: '🏆' },
  { view: 'quests', label: 'Tagesaufgaben', icon: '📋' },
  { view: 'achievements', label: 'Erfolge', icon: '🎖️' },
  { view: 'shop', label: 'Shop', icon: '🛍️' },
  { view: 'profile', label: 'Profil', icon: '🦎' },
]

export default function Sidebar() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  return (
    <nav className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-1 border-r p-4 lg:flex" style={{ borderColor: 'var(--border)' }}>
      <div className="mb-4 flex items-center gap-2 px-2 text-xl font-extrabold" style={{ color: 'var(--primary-dark)' }}>
        <span className="text-3xl">🦎</span> ZehnFinger
      </div>
      {ITEMS.map((item) => (
        <button
          key={item.view}
          onClick={() => setView(item.view)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-bold transition-colors"
          style={{
            background: view === item.view ? 'var(--kb-key-bg)' : 'transparent',
            color: view === item.view ? 'var(--primary-dark)' : 'var(--text)',
          }}
        >
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
