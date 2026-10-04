import { useEffect } from 'react'
import { useStore, todayISO } from '../store/useStore'
import Icon from '../components/Icon'
import { BannerPattern } from '../components/Art'
import { Bar } from '../components/RightRail'

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
  const sessionLog = useStore((s) => s.sessionLog) ?? []
  const lastPracticeDateISO = useStore((s) => s.lastPracticeDateISO)
  const currentStreak = useStore((s) => s.currentStreak)

  useEffect(() => { ensureDaily() }, [ensureDaily])

  const progressFor = (metric: string) => ({
    xpEarnedToday, lessonsCompletedToday, perfectLessonsToday, charsTypedToday, bestComboToday,
  } as Record<string, number>)[metric] ?? 0

  const goalPct = Math.min(100, Math.round((xpEarnedToday / dailyGoalXP) * 100))
  const doneCount = quests.filter((q) => claimedIds.includes(q.id)).length

  // hours left until the quests reset (they are bound to the UTC day, like the rest of the daily state)
  const now = new Date()
  const msLeft = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime()
  const hoursLeft = Math.max(1, Math.ceil(msLeft / 3_600_000))

  // this week (Mon–Sun): days with at least one session
  const practiced = new Set(sessionLog.map((e) => e.d))
  if (lastPracticeDateISO) practiced.add(lastPracticeDateISO)
  const today = todayISO()
  const monday = new Date(today + 'T00:00:00Z')
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  const week = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((label, i) => {
    const d = new Date(monday)
    d.setUTCDate(d.getUTCDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return { label, iso, done: practiced.has(iso), isToday: iso === today, future: iso > today }
  })

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="relative mb-6 overflow-hidden rounded-3xl px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #ce82ff, #a568cc)', boxShadow: '0 5px 0 #8a4fb3' }}>
        <BannerPattern />
        <div className="relative flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">Heute · {doneCount}/{quests.length} erledigt</div>
            <h1 className="text-2xl font-black">Tagesaufgaben</h1>
            <p className="flex items-center gap-1.5 text-sm font-semibold opacity-90">
              <Icon name="clock" size={16} /> Neue Aufgaben in {hoursLeft} Std
            </p>
          </div>
          <Icon name="chest" size={72} />
        </div>
      </div>

      {/* streak week */}
      <div className="tile mb-5 p-4">
        <div className="mb-3 flex items-center gap-2 font-extrabold">
          <Icon name={currentStreak > 0 ? 'flame' : 'flameGray'} size={26} />
          {currentStreak > 0 ? `${currentStreak} Tage Serie` : 'Noch keine Serie'}
          <span className="ml-auto text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Diese Woche</span>
        </div>
        <div className="flex justify-between">
          {week.map((d) => (
            <div key={d.iso} className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-extrabold" style={{ color: d.isToday ? '#ff9600' : 'var(--text-muted)' }}>{d.label}</span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: d.done ? '#ff9600' : 'var(--kb-key-bg)',
                  boxShadow: d.isToday ? '0 0 0 3px color-mix(in srgb, #ff9600 45%, transparent)' : undefined,
                  opacity: d.future ? 0.5 : 1,
                }}
              >
                {d.done ? <Icon name="flame" size={22} className="icon-white" /> : <span className="h-2 w-2 rounded-full" style={{ background: 'var(--border)' }} />}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="tile mb-5 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Icon name="target" size={40} />
          <div className="flex-1">
            <div className="font-extrabold">Tagesziel</div>
            <Bar pct={goalPct} label={`${xpEarnedToday} / ${dailyGoalXP} EP`} color="#ffc800" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            [20, 'Locker'],
            [30, 'Normal'],
            [50, 'Ernsthaft'],
            [80, 'Intensiv'],
          ].map(([g, label]) => {
            const active = dailyGoalXP === g
            return (
              <button
                key={g}
                onClick={() => setDailyGoal(g as number)}
                className="btn-3d border-2 px-1 py-1.5 text-[11px]"
                style={{
                  background: active ? 'color-mix(in srgb, #1cb0f6 14%, var(--bg-elevated))' : 'var(--bg-elevated)',
                  borderColor: active ? '#1cb0f6' : 'var(--border)',
                  color: active ? '#1899d6' : 'var(--text-muted)',
                  ['--btn-edge' as string]: active ? '#1cb0f6' : 'var(--border)',
                }}
              >
                <div className="text-sm">{g} EP</div>
                <div className="normal-case tracking-normal">{label}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="tile flex flex-col divide-y-2" style={{ borderColor: 'var(--border)' }}>
        {quests.map((q) => {
          const value = progressFor(q.metric)
          const claimed = claimedIds.includes(q.id)
          const pct = Math.min(100, Math.round((value / q.goal) * 100))
          return (
            <div key={q.id} className="flex items-center gap-4 p-4" style={{ borderColor: 'var(--border)' }}>
              <Icon name={q.icon} size={44} />
              <div className="flex-1">
                <div className="mb-1.5 font-extrabold">{q.title}</div>
                <Bar pct={pct} label={`${Math.min(value, q.goal)} / ${q.goal}`} color={claimed ? '#58cc02' : '#ffc800'} />
              </div>
              <div className="flex w-12 flex-col items-center">
                <Icon name={claimed ? 'check' : 'chest'} size={34} muted={!claimed && pct < 100} />
                <span className="flex items-center text-[11px] font-extrabold" style={{ color: '#1cb0f6' }}>
                  +{q.gemReward}
                  <Icon name="gem" size={12} />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
