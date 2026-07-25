import { useStore, levelFromXP } from '../../store/useStore'

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
      className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b px-4 py-2.5 backdrop-blur sm:px-6"
      style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)', borderColor: 'var(--border)' }}
    >
      <button onClick={() => setView('path')} className="flex items-center gap-2 font-extrabold" style={{ color: 'var(--primary-dark)' }}>
        <span className="text-2xl">🦎</span>
        <span className="hidden text-lg sm:inline">ZehnFinger</span>
      </button>

      <div className="hidden flex-1 items-center gap-2 sm:flex" style={{ maxWidth: 220 }}>
        <span className="icon-badge h-7 w-7 text-sm" style={{ background: 'color-mix(in srgb, var(--primary) 18%, var(--bg-elevated))' }}>🎯</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
          <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: 'var(--primary)' }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{xpEarnedToday}/{dailyGoalXP}</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm font-bold sm:gap-2">
        <button
          onClick={toggleDarkMode}
          className="icon-badge h-8 w-8 text-base"
          style={{ background: 'var(--kb-key-bg)' }}
          title={darkMode ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
          aria-label="Dark Mode umschalten"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => setView('profile')}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-emerald-600"
          style={{ background: 'color-mix(in srgb, var(--primary) 12%, var(--bg-elevated))' }}
          title="Level"
        >
          <span className="icon-badge h-5 w-5 text-[10px] text-white" style={{ background: 'var(--primary)' }}>{level}</span>
        </button>
        <button
          onClick={() => setView('league')}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-orange-500"
          style={{ background: 'color-mix(in srgb, #f97316 12%, var(--bg-elevated))' }}
          title="Serie"
        >
          🔥 {streak}
        </button>
        <button
          onClick={() => setView('shop')}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sky-500"
          style={{ background: 'color-mix(in srgb, #0ea5e9 12%, var(--bg-elevated))' }}
          title="Gems"
        >
          💎 {gems}
        </button>
      </div>
    </header>
  )
}
