import { useStore, levelFromXP } from '../../store/useStore'
import Icon from '../Icon'
import Mascot from '../Mascot'

export default function TopBar() {
  const streak = useStore((s) => s.currentStreak)
  const gems = useStore((s) => s.gems)
  const totalXP = useStore((s) => s.totalXP)
  const xpEarnedToday = useStore((s) => s.xpEarnedToday)
  const dailyGoalXP = useStore((s) => s.dailyGoalXP)
  const darkMode = useStore((s) => s.darkMode)
  const toggleDarkMode = useStore((s) => s.toggleDarkMode)
  const setView = useStore((s) => s.setView)

  const goalPct = Math.min(100, Math.round((xpEarnedToday / dailyGoalXP) * 100))
  const { level } = levelFromXP(totalXP)

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b-2 px-4 py-2 backdrop-blur sm:px-6"
      style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)', borderColor: 'var(--border)' }}
    >
      <button onClick={() => setView('path')} className="flex items-center gap-1.5 font-black lg:invisible" style={{ color: 'var(--primary-dark)' }}>
        <Mascot mood="happy" size={32} />
        <span className="hidden text-lg sm:inline">ZehnFinger</span>
      </button>

      <button onClick={() => setView('quests')} className="hidden flex-1 items-center gap-2 sm:flex" style={{ maxWidth: 240 }} title="Tagesziel">
        <Icon name="target" size={24} />
        <div className="relative h-3.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
          <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: 'linear-gradient(180deg, #8ee000, #58cc02)' }} />
          <div className="absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/40" style={{ width: `calc(${goalPct}% - 16px)` }} />
        </div>
        <span className="text-xs font-extrabold" style={{ color: 'var(--text-muted)' }}>{xpEarnedToday}/{dailyGoalXP}</span>
      </button>

      <div className="flex items-center gap-1 text-[15px] font-extrabold sm:gap-3">
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-black/5"
          title={darkMode ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
          aria-label="Dark Mode umschalten"
        >
          <Icon name={darkMode ? 'sun' : 'moon'} size={24} />
        </button>
        <button onClick={() => setView('profile')} className="flex items-center gap-1 rounded-xl px-1.5 py-1 hover:bg-black/5" style={{ color: '#ce82ff' }} title="Level">
          <Icon name="star" size={24} />
          <span>{level}</span>
        </button>
        <button onClick={() => setView('league')} className="flex items-center gap-1 rounded-xl px-1.5 py-1 hover:bg-black/5" style={{ color: streak > 0 ? '#ff9600' : 'var(--text-muted)' }} title="Serie">
          <Icon name={streak > 0 ? 'flame' : 'flameGray'} size={24} />
          <span>{streak}</span>
        </button>
        <button onClick={() => setView('shop')} className="flex items-center gap-1 rounded-xl px-1.5 py-1 hover:bg-black/5" style={{ color: '#1cb0f6' }} title="Gems">
          <Icon name="gem" size={24} />
          <span>{gems}</span>
        </button>
      </div>
    </header>
  )
}
