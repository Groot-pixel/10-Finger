import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { LEAGUES, computeLeagueBoard, PROMOTE_COUNT, DEMOTE_COUNT, weekFractionElapsed } from '../data/league'
import Mascot from '../components/Mascot'

function formatCountdown(weekStartISO: string): string {
  const start = new Date(weekStartISO + 'T00:00:00Z').getTime()
  const end = start + 7 * 24 * 60 * 60 * 1000
  const remaining = Math.max(0, end - Date.now())
  const days = Math.floor(remaining / (24 * 3600 * 1000))
  const hours = Math.floor((remaining % (24 * 3600 * 1000)) / (3600 * 1000))
  return `${days}T ${hours}Std`
}

export default function LeaguePage() {
  const divisionIndex = useStore((s) => s.leagueDivisionIndex)
  const weekStartISO = useStore((s) => s.leagueWeekStartISO)
  const weeklyXP = useStore((s) => s.leagueWeeklyXP)
  const name = useStore((s) => s.name)
  const ensureLeagueWeek = useStore((s) => s.ensureLeagueWeek)
  const banner = useStore((s) => s.leagueBanner)
  const dismissBanner = useStore((s) => s.dismissLeagueBanner)
  const [, setTick] = useState(0)

  useEffect(() => {
    ensureLeagueWeek()
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [ensureLeagueWeek])

  const league = LEAGUES[divisionIndex]
  const board = useMemo(
    () => computeLeagueBoard(divisionIndex, weekStartISO, name, weeklyXP),
    [divisionIndex, weekStartISO, name, weeklyXP],
  )
  const fraction = weekFractionElapsed(weekStartISO)

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {banner && (
        <div
          className="pop-in mb-6 flex items-center gap-3 rounded-2xl border-2 p-4"
          style={{ borderColor: banner.promoted ? '#22c55e' : '#ef4444', background: 'var(--bg-elevated)' }}
        >
          <Mascot mood={banner.promoted ? 'excited' : 'sad'} size={56} />
          <div className="flex-1">
            <div className="font-extrabold">
              {banner.promoted ? `Aufstieg in die ${banner.leagueName}-Liga! ${banner.leagueIcon}` : `Abstieg in die ${banner.leagueName}-Liga`}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Eine neue Woche beginnt jetzt!</div>
          </div>
          <button onClick={dismissBanner} className="text-lg">✕</button>
        </div>
      )}

      <div className="mb-6 rounded-2xl p-5 text-center text-white shadow" style={{ background: `linear-gradient(135deg, ${league.color}, ${league.color}bb)` }}>
        <div className="text-4xl">{league.icon}</div>
        <div className="text-xl font-extrabold">{league.name}</div>
        <div className="text-sm opacity-90">Nächste Woche in {formatCountdown(weekStartISO)}</div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-white" style={{ width: `${Math.round(fraction * 100)}%` }} />
        </div>
      </div>

      <ol className="flex flex-col gap-1.5">
        {board.map((entry, i) => {
          const rank = i + 1
          const zone = rank <= PROMOTE_COUNT ? 'promote' : rank > board.length - DEMOTE_COUNT ? 'demote' : 'safe'
          return (
            <li
              key={entry.name}
              className="flex items-center gap-3 rounded-xl border px-3 py-2"
              style={{
                borderColor: entry.isPlayer ? 'var(--primary)' : 'var(--border)',
                background: entry.isPlayer ? 'color-mix(in srgb, var(--primary) 12%, var(--bg-elevated))' : 'var(--bg-elevated)',
              }}
            >
              <span className="w-6 text-center font-extrabold" style={{ color: 'var(--text-muted)' }}>
                {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
              </span>
              <span className="flex-1 truncate font-bold">{entry.isPlayer ? `${entry.name} (Du)` : entry.name}</span>
              <span className="font-extrabold" style={{ color: 'var(--primary-dark)' }}>{entry.xp} EP</span>
              {zone === 'promote' && <span title="Aufstiegszone" className="text-emerald-500">▲</span>}
              {zone === 'demote' && divisionIndex > 0 && <span title="Abstiegszone" className="text-rose-500">▼</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
