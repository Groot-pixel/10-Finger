import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { LEAGUES, computeLeagueBoard, PROMOTE_COUNT, DEMOTE_COUNT, weekFractionElapsed } from '../data/league'
import Mascot from '../components/Mascot'
import Icon from '../components/Icon'
import { Avatar, LeagueBadge} from '../components/Art'
import { shade } from '../utils/color'

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

  const top3 = board.slice(0, 3)
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean)
  const playerRank = board.findIndex((e) => e.isPlayer) + 1

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {banner && (
        <div
          className="pop-in tile mb-6 flex items-center gap-3 p-4"
          style={{ borderColor: banner.promoted ? '#58cc02' : '#ff4b4b' }}
        >
          <Mascot mood={banner.promoted ? 'excited' : 'sad'} size={56} />
          <div className="flex-1">
            <div className="font-extrabold">
              {banner.promoted ? `Aufstieg in die ${banner.leagueName}-Liga!` : `Abstieg in die ${banner.leagueName}-Liga`}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Eine neue Woche beginnt jetzt!</div>
          </div>
          <button onClick={dismissBanner} className="rounded-lg p-1 opacity-50 hover:opacity-100" aria-label="Schließen">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {/* all leagues as a row of crests, the current one big */}
      <div className="mb-3 flex items-end justify-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {LEAGUES.map((l, i) => (
          <div key={l.id} className="flex shrink-0 flex-col items-center" title={l.name}>
            <LeagueBadge index={i} size={i === divisionIndex ? 64 : 30} locked={i > divisionIndex} />
          </div>
        ))}
      </div>
      <div className="mb-1 text-center text-2xl font-black">{league.name}</div>
      <div className="mb-1 text-center text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        Die besten {PROMOTE_COUNT} steigen in die nächste Liga auf
      </div>
      <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-extrabold" style={{ background: 'var(--kb-key-bg)', color: '#ff9600' }}>
        <Icon name="clock" size={18} /> noch {formatCountdown(weekStartISO)}
        <span className="ml-1 h-2 w-16 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
          <span className="block h-full rounded-full" style={{ width: `${Math.round(fraction * 100)}%`, background: '#ff9600' }} />
        </span>
      </div>

      {/* podium */}
      <div className="mb-6 flex items-end justify-center gap-3">
        {podium.map((e) => {
          const place = top3.indexOf(e) + 1
          const h = place === 1 ? 92 : place === 2 ? 68 : 52
          const color = place === 1 ? '#ffc800' : place === 2 ? '#c4ccd4' : '#d08a4b'
          return (
            <div key={e.name} className="flex w-28 flex-col items-center">
              {place === 1 && <Icon name="crown" size={28} />}
              <div className="relative">
                <Avatar name={e.name} size={place === 1 ? 58 : 48} />
                {e.isPlayer && <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-1 text-[9px] font-black text-emerald-600 shadow">DU</span>}
              </div>
              <div className="mt-1 w-full truncate text-center text-xs font-extrabold">{e.name}</div>
              <div className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>{e.xp} EP</div>
              <div
                className="mt-1 flex w-full items-start justify-center rounded-t-xl pt-1.5 text-2xl font-black text-white"
                style={{ height: h, background: `linear-gradient(180deg, ${color}, ${shade(color, -0.18)})`, boxShadow: `inset 0 4px 0 ${shade(color, 0.3)}` }}
              >
                {place}
              </div>
            </div>
          )
        })}
      </div>

      <ol className="tile flex flex-col overflow-hidden p-2">
        {board.map((entry, i) => {
          const rank = i + 1
          const promoteLine = rank === PROMOTE_COUNT + 1
          const demoteLine = divisionIndex > 0 && rank === board.length - DEMOTE_COUNT + 1
          return (
            <li key={entry.name}>
              {promoteLine && <ZoneLine color="#58cc02" icon="chevron" text="Aufstiegszone" up />}
              {demoteLine && <ZoneLine color="#ff4b4b" icon="chevron" text="Abstiegszone" />}
              <div
                className="flex items-center gap-3 rounded-xl px-2 py-2"
                style={{ background: entry.isPlayer ? 'color-mix(in srgb, #58cc02 14%, var(--bg-elevated))' : 'transparent' }}
              >
                <span className="w-7 text-center text-sm font-black" style={{ color: rank <= 3 ? ['#e5a400', '#9aa5ad', '#b8733a'][rank - 1] : rank <= PROMOTE_COUNT ? '#58a700' : 'var(--text-muted)' }}>
                  {rank}
                </span>
                <Avatar name={entry.name} size={36} />
                <span className="flex-1 truncate font-bold">{entry.isPlayer ? `${entry.name} (Du)` : entry.name}</span>
                <span className="text-sm font-extrabold" style={{ color: 'var(--text-muted)' }}>{entry.xp} EP</span>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
        Du bist gerade auf Platz {playerRank}. Jede Lektion bringt EP für die Liga.
      </p>
    </div>
  )
}

function ZoneLine({ color, text, up }: { color: string; icon: string; text: string; up?: boolean }) {
  return (
    <div className="my-1.5 flex items-center gap-2 px-2 text-[11px] font-extrabold uppercase tracking-wider" style={{ color }}>
      <span className="h-0.5 flex-1 rounded" style={{ background: color, opacity: 0.4 }} />
      <span style={{ transform: up ? 'rotate(-90deg)' : 'rotate(90deg)', display: 'inline-flex' }}><Icon name="chevron" size={14} /></span>
      {text}
      <span className="h-0.5 flex-1 rounded" style={{ background: color, opacity: 0.4 }} />
    </div>
  )
}
