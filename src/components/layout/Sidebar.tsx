import { useStore } from '../../store/useStore'
import type { ViewKind } from '../../types'
import Icon from '../Icon'
import Mascot from '../Mascot'

const ITEMS: { view: ViewKind; label: string; icon: string }[] = [
  { view: 'path', label: 'Lernpfad', icon: 'map' },
  { view: 'practice', label: 'Übungsstube', icon: 'dumbbell' },
  { view: 'league', label: 'Liga', icon: 'trophy' },
  { view: 'quests', label: 'Tagesaufgaben', icon: 'quests' },
  { view: 'achievements', label: 'Erfolge', icon: 'medal' },
  { view: 'shop', label: 'Shop', icon: 'shop' },
  { view: 'profile', label: 'Profil', icon: 'profile' },
]

export default function Sidebar() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  return (
    <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1.5 border-r p-4 lg:flex" style={{ borderColor: 'var(--border)' }}>
      <button onClick={() => setView('path')} className="mb-5 flex items-center gap-2 px-2 text-2xl font-black tracking-tight" style={{ color: 'var(--primary-dark)' }}>
        <Mascot mood="happy" size={40} />
        ZehnFinger
      </button>
      {ITEMS.map((item) => {
        const active = view === item.view
        return (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className="flex items-center gap-3.5 rounded-xl border-2 px-3 py-2.5 text-left text-[15px] font-extrabold uppercase tracking-wide transition-colors"
            style={{
              background: active ? 'color-mix(in srgb, var(--blue, #35c7b5) 12%, var(--bg-elevated))' : 'transparent',
              borderColor: active ? 'color-mix(in srgb, #35c7b5 55%, transparent)' : 'transparent',
              color: active ? '#22a99c' : 'var(--text-muted)',
            }}
          >
            <Icon name={item.icon} size={30} />
            <span className="text-[13px]">{item.label}</span>
          </button>
        )
      })}
      <div className="mt-auto rounded-2xl border-2 p-3 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="mb-1 flex items-center gap-2 font-extrabold" style={{ color: 'var(--text)' }}>
          <Icon name="keyboard" size={20} /> Tastatur-Tipp
        </div>
        Die kleinen Erhebungen auf <b>F</b> und <b>J</b> zeigen dir, wo deine Zeigefinger hingehören – ganz ohne hinzusehen.
      </div>
    </nav>
  )
}
