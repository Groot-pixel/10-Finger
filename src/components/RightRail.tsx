import { useStore, levelFromXP } from '../store/useStore'
import { LEAGUES } from '../data/league'
import Icon from './Icon'
import { LeagueBadge } from './Art'

const TIPS = [
  'Schau beim Tippen auf den Bildschirm, nicht auf die Tastatur – auch wenn es am Anfang langsamer ist.',
  'Nach jedem Anschlag kehrt der Finger auf seine Grundtaste zurück.',
  'Sitz aufrecht, Unterarme waagerecht, Handgelenke locker – so ermüdest du nicht.',
  'Genauigkeit vor Tempo: Wer sauber tippt, wird automatisch schneller.',
  'Lieber jeden Tag 10 Minuten als einmal pro Woche eine Stunde.',
  'Die Leertaste drückst du mit dem Daumen der Hand, die gerade nicht getippt hat.',
  'Atme ruhig weiter, wenn es schwierig wird – verkrampfte Finger machen mehr Fehler.',
]

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
  const tip = TIPS[Math.floor(Date.now() / 86_400_000) % TIPS.length]

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
      <div className="tile flex items-center gap-3 p-4">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--kb-key-bg)" strokeWidth="6" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="#eda958" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(levelPct / 100) * 150.8} 150.8`} />
          </svg>
          <span className="text-lg font-black" style={{ color: '#c27a35' }}>{level}</span>
        </div>
        <div className="flex-1">
          <div className="font-extrabold">Level {level}</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Noch {xpForNextLevel - xpIntoLevel} EP bis Level {level + 1}
          </div>
        </div>
        <Icon name="star" size={30} />
      </div>

      <button onClick={() => setView('league')} className="tile tile-hover flex items-center gap-3 p-4 text-left">
        <LeagueBadge index={leagueDivisionIndex} size={44} />
        <div className="flex-1">
          <div className="font-extrabold">{league.name}</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{leagueWeeklyXP} EP diese Woche</div>
        </div>
        <Icon name="chevron" size={18} className="opacity-40" />
      </button>

      <div className="tile flex items-center gap-3 p-4">
        <Icon name={currentStreak > 0 ? 'flame' : 'flameGray'} size={44} />
        <div className="flex-1">
          <div className="font-extrabold">{currentStreak} Tage Serie</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Rekord: {longestStreak} Tage</div>
        </div>
      </div>

      <button onClick={() => setView('quests')} className="tile tile-hover flex flex-col gap-3 p-4 text-left">
        <div className="flex items-center justify-between">
          <span className="font-extrabold">Tagesaufgaben</span>
          <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#35c7b5' }}>Alle zeigen</span>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="target" size={34} />
          <div className="flex-1">
            <div className="mb-1 text-sm font-bold">Tagesziel: {dailyGoalXP} EP</div>
            <Bar pct={goalPct} label={`${xpEarnedToday} / ${dailyGoalXP}`} color="#f0b45a" />
          </div>
        </div>
        {dailyQuests.map((q) => {
          const claimed = claimedQuestIds.includes(q.id)
          const value = progressFor(q.metric)
          const pct = Math.min(100, Math.round((value / q.goal) * 100))
          return (
            <div key={q.id} className="flex items-center gap-3">
              <Icon name={claimed ? 'check' : q.icon} size={34} />
              <div className="flex-1">
                <div className="mb-1 text-sm font-bold">{q.title}</div>
                <Bar pct={pct} label={`${Math.min(value, q.goal)} / ${q.goal}`} color={claimed ? '#2fb9a8' : '#f0b45a'} />
              </div>
            </div>
          )
        })}
      </button>

      <div className="tile p-4">
        <div className="mb-1.5 flex items-center gap-2 font-extrabold">
          <Icon name="lightbulb" size={24} /> Tipp des Tages
        </div>
        <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{tip}</p>
      </div>
    </aside>
  )
}

/** chunky progress bar with the value written inside */
export function Bar({ pct, label, color }: { pct: number; label?: string; color: string }) {
  return (
    <div className="relative h-4 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(pct, pct > 0 ? 8 : 0)}%`, background: color }}>
        <div className="mx-2 mt-[3px] h-1 rounded-full bg-white/40" />
      </div>
      {label && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold" style={{ color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  )
}
