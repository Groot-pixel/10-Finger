import { useStore } from '../../store/useStore'
import type { ViewKind } from '../../types'
import Icon from '../Icon'

const ITEMS: { view: ViewKind; label: string; icon: string }[] = [
  { view: 'path', label: 'Pfad', icon: 'map' },
  { view: 'practice', label: 'Übung', icon: 'dumbbell' },
  { view: 'league', label: 'Liga', icon: 'trophy' },
  { view: 'quests', label: 'Ziele', icon: 'quests' },
  { view: 'shop', label: 'Shop', icon: 'shop' },
  { view: 'profile', label: 'Profil', icon: 'profile' },
]

export default function BottomNav() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  return (
    <nav
      className="sticky bottom-0 z-30 flex items-center justify-around border-t-2 px-1 py-1.5 lg:hidden"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
    >
      {ITEMS.map((item) => {
        const active = view === item.view
        return (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border-2 py-1 text-[10px] font-extrabold"
            style={{
              color: active ? '#1899d6' : 'var(--text-muted)',
              borderColor: active ? 'color-mix(in srgb, #1cb0f6 55%, transparent)' : 'transparent',
              background: active ? 'color-mix(in srgb, #1cb0f6 12%, var(--bg-elevated))' : 'transparent',
            }}
          >
            <Icon name={item.icon} size={26} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
