import { useStore, levelFromXP } from '../store/useStore'
import { LEAGUES } from '../data/league'

export default function RightRail() {
  const totalXP = useStore((s) => s.totalXP)
  const currentStreak = useStore((s) => s.currentStreak)
  const longestStreak = useStore((s) => s.longestStreak)
  const xpEarnedToday = useStore((s) => s.xpEarnedToday)
  const dailyGoalXP = useStore((s) => s.dailyGoalXP)
  const leagueDivisionIndex = useStore((s) => s.leagueDivisionIndex)
  const leagueWeeklyXP = useStore((s) => s.leagueWeeklyXP)
  const dailyQuests = useStore((s) => s.dailyQuests)
  const claimedQuestIds = useStore((s) => s.claimedQuestIds)
  const setView = useStore((s) => s.setView)

  const { level, xpIntoLevel, xpForNextLevel } = levelFromXP(totalXP)
  const goalPct = Math.min(100, Math.round((xpEarnedToday / dailyGoalXP) * 100))
  const levelPct = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100))
  const league = LEAGUES[leagueDivisionIndex]

  const progressFor = (metric: string) =>
    ({
      xpEarnedToday,
      lessonsCompletedToday: useStore.getState().lessonsCompletedToday,
      perfectLessonsToday: useStore.getState().perfectLessonsToday,
      charsTypedToday: useStore.getState().charsTypedToday,
      bestComboToday: useStore.getState().bestComboToday,
    })[metric] ?? 0

  return (
    <aside className="sticky top-20 hidden w-80 shrink-0 flex-col gap-4 self-start lg:flex">
      <div className="card-surface rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div
            className="icon-badge h-12 w-12 text-xl font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, var(--primary), var(--primary-dark))` }}
          >
            {level}
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold">Level {level}</div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
              <div className="h-full rounded-full" style={{ width: `${levelPct}%`, background: 'var(--primary)' }} />
            </div>
            <div className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {xpIntoLevel}/{xpForNextLevel} EP bis Level {level + 1}
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setView('quests')} className="card-surface rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5">
        <div className="mb-2 flex items-center gap-2">
          <span className="icon-badge h-9 w-9 text-lg" style={{ background: 'color-mix(in srgb, var(--primary) 18%, var(--bg-elevated))' }}>🎯</span>
          <span className="font-extrabold">Tagesziel</span>
          <span className="ml-auto text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{xpEarnedToday}/{dailyGoalXP} EP</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
          <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: 'var(--primary)' }} />
        </div>
      </button>

      <button onClick={() => setView('league')} className="card-surface flex items-center gap-3 rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5">
        <span className="icon-badge h-11 w-11 text-2xl" style={{ background: `${league.color}22` }}>{league.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-extrabold">{league.name}</div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{leagueWeeklyXP} EP diese Woche</div>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>›</span>
      </button>

      <div className="card-surface flex items-center gap-3 rounded-2xl p-4">
        <span className="icon-badge h-11 w-11 text-2xl" style={{ background: 'color-mix(in srgb, #f97316 18%, var(--bg-elevated))' }}>🔥</span>
        <div>
          <div className="text-sm font-extrabold">{currentStreak} Tage Serie</div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Rekord: {longestStreak} Tage</div>
        </div>
      </div>

      <button onClick={() => setView('quests')} className="card-surface flex flex-col gap-2.5 rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5">
        <div className="flex items-center gap-2 font-extrabold">
          <span className="icon-badge h-9 w-9 text-lg" style={{ background: 'color-mix(in srgb, var(--accent) 18%, var(--bg-elevated))' }}>📋</span>
          Tagesaufgaben
        </div>
        {dailyQuests.map((q) => {
          const claimed = claimedQuestIds.includes(q.id)
          const pct = Math.min(100, Math.round((progressFor(q.metric) / q.goal) * 100))
          return (
            <div key={q.id} className="flex items-center gap-2 text-xs">
              <span>{claimed ? '✅' : q.icon}</span>
              <span className="flex-1 truncate" style={{ color: claimed ? 'var(--text-muted)' : 'var(--text)' }}>{q.title}</span>
              <div className="h-1.5 w-12 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: claimed ? '#22c55e' : 'var(--accent)' }} />
              </div>
            </div>
          )
        })}
      </button>
    </aside>
  )
}
