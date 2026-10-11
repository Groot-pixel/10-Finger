import { useMemo, useState } from 'react'
import { useStore, type SessionLogEntry } from '../store/useStore'
import Icon from '../components/Icon'
import Mascot from '../components/Mascot'
import { BannerPattern } from '../components/Art'

type Range = 7 | 30 | 90 | 0
type Kind = 'all' | 'path' | 'practice' | 'speedtest'

const RANGES: { v: Range; label: string }[] = [
  { v: 7, label: '7 Tage' },
  { v: 30, label: '30 Tage' },
  { v: 90, label: '90 Tage' },
  { v: 0, label: 'Alles' },
]
const KINDS: { v: Kind; label: string }[] = [
  { v: 'all', label: 'Alle' },
  { v: 'path', label: 'Lektionen' },
  { v: 'practice', label: 'Übungen' },
  { v: 'speedtest', label: 'Tempotests' },
]
const KIND_LABEL: Record<string, string> = {
  path: 'Lektion',
  practice: 'Übung',
  speedtest: 'Tempotest',
  placement: 'Einstufung',
}

const DAY = 86_400_000
const COLORS = { wpm: '#35c7b5', acc: '#f0b45a', err: '#ff6b6b' }

/** error rate in percent: mistakes per typed character (falls back to 100 − accuracy for old entries) */
const errorRate = (e: SessionLogEntry) => (e.c && e.m !== undefined ? (e.m / Math.max(1, e.c)) * 100 : 100 - e.acc)
const timeOf = (e: SessionLogEntry) => e.t ?? new Date(e.d + 'T12:00:00').getTime()
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const round1 = (x: number) => Math.round(x * 10) / 10

function fmtDuration(sec: number): string {
  const m = Math.round(sec / 60)
  if (m < 60) return `${m} Min`
  return `${Math.floor(m / 60)} Std ${m % 60} Min`
}

export default function StatsPage() {
  const stored = useStore((s) => s.sessionLog)
  const log = useMemo(() => stored ?? [], [stored])
  const keyStats = useStore((s) => s.keyStats)
  const pushToast = useStore((s) => s.pushToast)
  const [range, setRange] = useState<Range>(30)
  const [kind, setKind] = useState<Kind>('all')
  const [shown, setShown] = useState(15)

  const { cur, prev } = useMemo(() => {
    const byKind = log.filter((e) => kind === 'all' || (e.k ?? 'path') === kind)
    if (!range) return { cur: byKind, prev: [] as SessionLogEntry[] }
    const now = Date.now()
    const from = now - range * DAY
    return {
      cur: byKind.filter((e) => timeOf(e) >= from),
      prev: byKind.filter((e) => timeOf(e) >= from - range * DAY && timeOf(e) < from),
    }
  }, [log, range, kind])

  const summary = (xs: SessionLogEntry[]) => ({
    wpm: avg(xs.map((e) => e.wpm)),
    acc: avg(xs.map((e) => e.acc)),
    err: avg(xs.map(errorRate)),
  })
  const now = summary(cur)
  const before = prev.length ? summary(prev) : null
  const totalSec = cur.reduce((a, e) => a + (e.s ?? 0), 0)
  const totalChars = cur.reduce((a, e) => a + (e.c ?? 0), 0)
  const bestWpm = cur.reduce((a, e) => Math.max(a, e.wpm), 0)
  const bestAcc = cur.reduce((a, e) => Math.max(a, e.acc), 0)

  // one point per day: the daily average – that is what shows the learning curve
  const days = useMemo(() => {
    const map = new Map<string, SessionLogEntry[]>()
    for (const e of cur) map.set(e.d, [...(map.get(e.d) ?? []), e])
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([d, xs]) => ({ d, n: xs.length, wpm: avg(xs.map((e) => e.wpm)), acc: avg(xs.map((e) => e.acc)), err: avg(xs.map(errorRate)) }))
  }, [cur])

  // keys with the most mistakes in the selected period
  const problemKeys = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of cur) for (const [k, n] of Object.entries(e.e ?? {})) m.set(k, (m.get(k) ?? 0) + n)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [cur])

  const exportCsv = () => {
    const head = 'Datum;Uhrzeit;Art;Titel;WPM;Genauigkeit %;Fehlerquote %;Fehler;Zeichen;Dauer s;EP'
    const rows = [...log]
      .sort((a, b) => timeOf(a) - timeOf(b))
      .map((e) => {
        const t = e.t ? new Date(e.t) : null
        return [
          e.d,
          t ? t.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
          KIND_LABEL[e.k ?? 'path'] ?? '',
          (e.n ?? '').replace(/;/g, ','),
          e.wpm,
          String(e.acc).replace('.', ','),
          String(round1(errorRate(e))).replace('.', ','),
          e.m ?? '',
          e.c ?? '',
          e.s ?? '',
          e.xp,
        ].join(';')
      })
    // BOM so Excel opens umlauts correctly
    const blob = new Blob(['﻿' + [head, ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ZehnFinger-Ergebnisse-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    pushToast({ icon: 'chart', title: 'Tabelle gespeichert', subtitle: 'Öffnen mit Excel oder LibreOffice', tone: 'success' })
  }

  const list = [...cur].sort((a, b) => timeOf(b) - timeOf(a))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="relative mb-6 overflow-hidden rounded-3xl px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #35c7b5, #168e83)', boxShadow: '0 5px 0 #0d7069' }}>
        <BannerPattern />
        <div className="relative flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">Dein Lernfortschritt</div>
            <h1 className="text-2xl font-black">Statistik</h1>
            <p className="text-sm font-semibold opacity-90">Jede Übung wird gespeichert – hier siehst du, wie du besser wirst.</p>
          </div>
          <Icon name="chart" size={64} />
        </div>
      </div>

      {/* filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Segmented options={RANGES} value={range} onChange={setRange} />
        <Segmented options={KINDS} value={kind} onChange={setKind} />
        <button
          onClick={exportCsv}
          disabled={!log.length}
          className="btn-3d ml-auto flex items-center gap-1.5 border-2 px-3 py-1.5 text-xs"
          style={{ borderColor: 'var(--border)', color: '#35c7b5', ['--btn-edge' as string]: 'var(--border)' }}
          title="Alle Ergebnisse als Tabelle (CSV) für Excel herunterladen"
        >
          <Icon name="chart" size={16} /> Als Tabelle
        </button>
      </div>

      {cur.length === 0 ? (
        <div className="tile flex items-center gap-4 p-6">
          <Mascot mood="neutral" size={80} />
          <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>
            {log.length
              ? 'In diesem Zeitraum gibt es noch keine Ergebnisse. Wähle einen längeren Zeitraum oder mach eine Übung!'
              : 'Noch keine Ergebnisse. Mach eine Lektion oder Übung – jedes Ergebnis wird hier gespeichert und ausgewertet.'}
          </p>
        </div>
      ) : (
        <>
          {/* key figures with trend against the previous period */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi icon="bolt" label="Ø Schnelligkeit" value={`${Math.round(now.wpm)}`} unit="WPM" color={COLORS.wpm} delta={before ? now.wpm - before.wpm : null} deltaUnit=" WPM" />
            <Kpi icon="target" label="Ø Genauigkeit" value={`${round1(now.acc)}`} unit="%" color={COLORS.acc} delta={before ? now.acc - before.acc : null} deltaUnit=" %" />
            <Kpi icon="warning" label="Ø Fehlerquote" value={`${round1(now.err)}`} unit="%" color={COLORS.err} delta={before ? now.err - before.err : null} deltaUnit=" %" lowerIsBetter />
          </div>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Small label="Übungen" value={cur.length} />
            <Small label="Übungszeit" value={fmtDuration(totalSec)} />
            <Small label="Bestwert WPM" value={bestWpm} />
            <Small label="Beste Genauigkeit" value={`${round1(bestAcc)} %`} />
          </div>
          {before && (
            <p className="-mt-5 mb-6 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Pfeile vergleichen mit den {range} Tagen davor ({prev.length} Übungen). {totalChars.toLocaleString('de-DE')} Zeichen getippt.
            </p>
          )}

          <ChartCard title="Schnelligkeit" sub="Wörter pro Minute, Tagesdurchschnitt" color={COLORS.wpm} points={days.map((d) => ({ d: d.d, v: d.wpm, n: d.n }))} unit="WPM" />
          <ChartCard title="Genauigkeit" sub="richtig getippte Zeichen in %, Tagesdurchschnitt" color={COLORS.acc} points={days.map((d) => ({ d: d.d, v: d.acc, n: d.n }))} unit="%" fixedMax={100} />
          <ChartCard title="Fehlerquote" sub="Fehler pro 100 Zeichen, Tagesdurchschnitt – je niedriger, desto besser" color={COLORS.err} points={days.map((d) => ({ d: d.d, v: d.err, n: d.n }))} unit="%" />

          {problemKeys.length > 0 && (
            <div className="tile mb-6 p-4">
              <div className="mb-3 font-extrabold">Häufigste Fehler in diesem Zeitraum</div>
              <div className="flex flex-col gap-1.5">
                {problemKeys.map(([k, n]) => {
                  const st = keyStats[k] ?? keyStats[k.toLowerCase()]
                  const rate = st && st.attempts ? Math.round((st.errors / st.attempts) * 100) : null
                  return (
                    <div key={k} className="flex items-center gap-3 text-sm">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg font-black" style={{ background: 'var(--kb-key-bg)' }}>{k === ' ' ? '␣' : k}</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(n / problemKeys[0][1]) * 100}%`, background: COLORS.err }} />
                      </div>
                      <span className="w-36 shrink-0 whitespace-nowrap text-right text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        {n}× falsch{rate !== null ? ` · ${rate} %` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* every single result */}
          <div className="tile overflow-hidden">
            <div className="px-4 pt-4 font-extrabold">Alle Ergebnisse</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    <th className="px-4 py-2">Wann</th>
                    <th className="py-2">Was</th>
                    <th className="py-2 text-right">WPM</th>
                    <th className="py-2 text-right">Genauigkeit</th>
                    <th className="py-2 text-right">Fehlerquote</th>
                    <th className="px-4 py-2 text-right">Dauer</th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice(0, shown).map((e, i) => (
                    <tr key={`${timeOf(e)}-${i}`} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="whitespace-nowrap px-4 py-2 font-semibold">
                        {new Date(timeOf(e)).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        {e.t && <span style={{ color: 'var(--text-muted)' }}> {new Date(e.t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </td>
                      <td className="py-2">
                        <span className="font-semibold">{e.n ?? KIND_LABEL[e.k ?? 'path'] ?? 'Übung'}</span>
                        {e.n && <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{KIND_LABEL[e.k ?? 'path']}</span>}
                      </td>
                      <td className="py-2 text-right font-bold" style={{ color: COLORS.wpm }}>{e.wpm}</td>
                      <td className="py-2 text-right font-bold" style={{ color: COLORS.acc }}>{round1(e.acc)} %</td>
                      <td className="py-2 text-right font-bold" style={{ color: COLORS.err }}>{round1(errorRate(e))} %</td>
                      <td className="px-4 py-2 text-right" style={{ color: 'var(--text-muted)' }}>{e.s !== undefined ? `${Math.floor(e.s / 60)}:${String(e.s % 60).padStart(2, '0')}` : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.length > shown && (
              <button onClick={() => setShown((n) => n + 30)} className="w-full border-t py-3 text-xs font-extrabold uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: '#35c7b5' }}>
                Mehr anzeigen ({list.length - shown} weitere)
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Segmented<T extends string | number>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl border-2 p-0.5" style={{ borderColor: 'var(--border)' }}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className="rounded-lg px-2.5 py-1 text-xs font-extrabold"
          style={{ background: value === o.v ? '#35c7b5' : 'transparent', color: value === o.v ? '#06221f' : 'var(--text-muted)' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Kpi({ icon, label, value, unit, color, delta, deltaUnit, lowerIsBetter }: {
  icon: string; label: string; value: string; unit: string; color: string; delta: number | null; deltaUnit: string; lowerIsBetter?: boolean
}) {
  const good = delta === null ? null : lowerIsBetter ? delta < 0 : delta > 0
  const d = delta === null ? null : round1(delta)
  return (
    <div className="tile flex items-center gap-3 p-4">
      <Icon name={icon} size={40} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-2xl font-black" style={{ color }}>
          {value}<span className="ml-1 text-sm font-bold">{unit}</span>
        </div>
        {d !== null && d !== 0 && (
          <div className="text-xs font-extrabold" style={{ color: good ? '#35c7b5' : '#ff6b6b' }}>
            {d > 0 ? '▲ +' : '▼ '}{d}{deltaUnit} {good ? 'besser' : 'schlechter'}
          </div>
        )}
      </div>
    </div>
  )
}

function Small({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="tile p-3">
      <div className="text-lg font-black">{value}</div>
      <div className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

/** line chart of daily averages with a trend line (linear regression) */
function ChartCard({ title, sub, color, points, unit, fixedMax }: {
  title: string; sub: string; color: string; points: { d: string; v: number; n: number }[]; unit: string; fixedMax?: number
}) {
  const W = 640
  const H = 190
  const P = { l: 38, r: 14, t: 14, b: 26 }
  const vals = points.map((p) => p.v)
  let lo = Math.min(...vals)
  let hi = fixedMax ?? Math.max(...vals)
  if (fixedMax) lo = Math.max(0, Math.floor(Math.min(lo, fixedMax - 10) / 5) * 5)
  else lo = Math.max(0, Math.floor((lo * 0.85) / 5) * 5)
  hi = Math.max(hi, lo + 5)
  if (!fixedMax) hi = Math.ceil((hi * 1.08) / 5) * 5
  const x = (i: number) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i / (points.length - 1)) * (W - P.l - P.r))
  const y = (v: number) => H - P.b - ((v - lo) / (hi - lo)) * (H - P.t - P.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')

  // trend: least squares over the day index
  let trend: { a: number; b: number } | null = null
  if (points.length >= 3) {
    const n = points.length
    const mx = (n - 1) / 2
    const my = avg(vals)
    let sxy = 0
    let sxx = 0
    points.forEach((p, i) => {
      sxy += (i - mx) * (p.v - my)
      sxx += (i - mx) ** 2
    })
    const b = sxx ? sxy / sxx : 0
    trend = { a: my - b * mx, b }
  }
  const ticks = [lo, (lo + hi) / 2, hi]
  const label = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  const labelIdx = points.length <= 6 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1]
  const gid = `g${title.replace(/\W/g, '')}`

  return (
    <div className="tile mb-6 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-extrabold" style={{ color }}>{title}</div>
        {trend && (
          <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            Trend: {trend.b >= 0 ? '+' : ''}{round1(trend.b)} {unit} pro Übungstag
          </div>
        )}
      </div>
      <div className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title} im Verlauf`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.3" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1.2" strokeDasharray="4 5" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--text-muted)">{Math.round(t)}</text>
          </g>
        ))}
        {points.length > 1 && <path d={`${line} L ${x(points.length - 1)} ${H - P.b} L ${x(0)} ${H - P.b} Z`} fill={`url(#${gid})`} />}
        {trend && (
          <line x1={x(0)} y1={y(trend.a)} x2={x(points.length - 1)} y2={y(trend.a + trend.b * (points.length - 1))} stroke={color} strokeWidth="2" strokeDasharray="6 5" opacity="0.6" />
        )}
        <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={p.d} cx={x(i)} cy={y(p.v)} r={points.length > 40 ? 2.5 : 4} fill={color} stroke="var(--bg-elevated)" strokeWidth="2">
            <title>{`${label(p.d)}: ${round1(p.v)} ${unit} (${p.n} Übung${p.n === 1 ? '' : 'en'})`}</title>
          </circle>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={points.length === 1 ? 'middle' : i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fontSize="11" fontWeight="700" fill="var(--text-muted)">
            {label(points[i].d)}
          </text>
        ))}
      </svg>
    </div>
  )
}
