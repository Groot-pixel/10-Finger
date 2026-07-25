import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import Mascot from '../components/Mascot'

export default function QuestsPage() {
  const ensureDaily = useStore((s) => s.ensureDaily)
  const quests = useStore((s) => s.dailyQuests)
  const claimedIds = useStore((s) => s.claimedQuestIds)
  const xpEarnedToday = useStore((s) => s.xpEarnedToday)
  const lessonsCompletedToday = useStore((s) => s.lessonsCompletedToday)
  const perfectLessonsToday = useStore((s) => s.perfectLessonsToday)
  const charsTypedToday = useStore((s) => s.charsTypedToday)
  const bestComboToday = useStore((s) => s.bestComboToday)
  const dailyGoalXP = useStore((s) => s.dailyGoalXP)
  const setDailyGoal = useStore((s) => s.setDailyGoal)

  useEffect(() => { ensureDaily() }, [ensureDaily])

  const progressFor = (metric: string) => ({
    xpEarnedToday, lessonsCompletedToday, perfectLessonsToday, charsTypedToday, bestComboToday,
  } as Record<string, number>)[metric] ?? 0

  const goalPct = Math.min(100, Math.round((xpEarnedToday / dailyGoalXP) * 100))

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Mascot mood={goalPct >= 100 ? 'excited' : 'neutral'} size={56} />
        <div>
          <h1 className="text-xl font-extrabold">📋 Tagesaufgaben</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Erledige Aufgaben für Bonus-Gems.</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-extrabold">🎯 Tagesziel</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{xpEarnedToday}/{dailyGoalXP} EP</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
          <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: 'var(--primary)' }} />
        </div>
        <div className="mt-3 flex gap-2">
          {[20, 30, 50, 80].map((g) => (
            <button
              key={g}
              onClick={() => setDailyGoal(g)}
              className="rounded-lg px-3 py-1 text-xs font-bold"
              style={{ background: dailyGoalXP === g ? 'var(--primary)' : 'var(--kb-key-bg)', color: dailyGoalXP === g ? 'white' : 'var(--text)' }}
            >
              {g} EP
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {quests.map((q) => {
          const value = progressFor(q.metric)
          const claimed = claimedIds.includes(q.id)
          const pct = Math.min(100, Math.round((value / q.goal) * 100))
          return (
            <div key={q.id} className="flex items-center gap-4 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <span className="text-2xl">{q.icon}</span>
              <div className="flex-1">
                <div className="font-bold">{q.title}</div>
                <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: claimed ? '#22c55e' : 'var(--accent)' }} />
                </div>
                <div className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>{Math.min(value, q.goal)}/{q.goal}</div>
              </div>
              <span className="text-sm font-extrabold" style={{ color: claimed ? '#22c55e' : 'var(--text-muted)' }}>
                {claimed ? '✓' : `+${q.gemReward}💎`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
