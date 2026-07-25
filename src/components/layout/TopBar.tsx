import { useStore } from '../../store/useStore'

export default function TopBar() {
  const streak = useStore((s) => s.currentStreak)
  const gems = useStore((s) => s.gems)
  const hearts = useStore((s) => s.hearts)
  const maxHearts = useStore((s) => s.maxHearts)
  const xpEarnedToday = useStore((s) => s.xpEarnedToday)
  const dailyGoalXP = useStore((s) => s.dailyGoalXP)
  const setView = useStore((s) => s.setView)

  const goalPct = Math.min(100, Math.round((xpEarnedToday / dailyGoalXP) * 100))

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
        <span className="text-lg">🎯</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
          <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: 'var(--primary)' }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{xpEarnedToday}/{dailyGoalXP}</span>
      </div>

      <div className="flex items-center gap-3 text-sm font-bold sm:gap-4 sm:text-base">
        <button onClick={() => setView('league')} className="flex items-center gap-1 text-orange-500" title="Serie">
          🔥 {streak}
        </button>
        <button onClick={() => setView('shop')} className="flex items-center gap-1 text-sky-500" title="Gems">
          💎 {gems}
        </button>
        <button onClick={() => setView('shop')} className="flex items-center gap-1 text-rose-500" title="Herzen">
          ❤️ {hearts}/{maxHearts}
        </button>
      </div>
    </header>
  )
}
