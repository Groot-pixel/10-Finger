import { useRef, useState } from 'react'
import { useStore, levelFromXP, todayISO, type SessionLogEntry } from '../store/useStore'
import { CURRICULUM } from '../data/curriculum'
import { ABC_TEXT } from '../data/keyboard'
import Mascot from '../components/Mascot'
import Icon from '../components/Icon'
import KeyHeatmap from '../components/KeyHeatmap'
import { BannerPattern, LeagueBadge } from '../components/Art'
import { Bar } from '../components/RightRail'
import { LEAGUES } from '../data/league'

export default function ProfilePage() {
  const name = useStore((s) => s.name)
  const createdAt = useStore((s) => s.createdAt)
  const totalXP = useStore((s) => s.totalXP)
  const bestWpm = useStore((s) => s.bestWpm)
  const longestStreak = useStore((s) => s.longestStreak)
  const currentStreak = useStore((s) => s.currentStreak)
  const lessonsCompleted = useStore((s) => s.lessonsCompleted)
  const totalCharsTyped = useStore((s) => s.totalCharsTyped)
  const perfectLessons = useStore((s) => s.perfectLessons)
  const lessonProgress = useStore((s) => s.lessonProgress)
  const keyStats = useStore((s) => s.keyStats)
  const sessionLog = useStore((s) => s.sessionLog) ?? []
  const equippedCosmetics = useStore((s) => s.equippedCosmetics)
  const leagueDivisionIndex = useStore((s) => s.leagueDivisionIndex)
  const soundEnabled = useStore((s) => s.soundEnabled)
  const toggleSound = useStore((s) => s.toggleSound)
  const resetProgress = useStore((s) => s.resetProgress)
  const setView = useStore((s) => s.setView)
  const startPractice = useStore((s) => s.startPractice)
  const setName = useStore((s) => s.setName)
  const setSetting = useStore((s) => s.setSetting)
  const importSave = useStore((s) => s.importSave)
  const pushToast = useStore((s) => s.pushToast)
  const showHands = useStore((s) => s.showHands)
  const showKeyboard = useStore((s) => s.showKeyboard)
  const showFingerGuide = useStore((s) => s.showFingerGuide)
  const bigText = useStore((s) => s.bigText)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(name)
  const fileRef = useRef<HTMLInputElement>(null)

  /** download the whole progress as a small backup file */
  const exportSave = () => {
    const state = Object.fromEntries(Object.entries(useStore.getState()).filter(([k, v]) => typeof v !== 'function' && !['toasts', 'activeSession', 'view'].includes(k)))
    const blob = new Blob([JSON.stringify({ app: 'zehnfinger', version: 1, savedAt: new Date().toISOString(), state }, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ZehnFinger-Backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    pushToast({ icon: 'chest', title: 'Backup gespeichert', subtitle: 'Die Datei liegt in deinen Downloads.', tone: 'success' })
  }
  const loadSave = async (file: File) => {
    try {
      const ok = importSave(JSON.parse(await file.text()))
      pushToast(ok
        ? { icon: 'check', title: 'Fortschritt geladen', subtitle: 'Willkommen zurück!', tone: 'success' }
        : { icon: 'warning', title: 'Das ist kein ZehnFinger-Backup', tone: 'warning' })
    } catch {
      pushToast({ icon: 'warning', title: 'Datei konnte nicht gelesen werden', tone: 'warning' })
    }
  }

  const [confirmReset, setConfirmReset] = useState(false)
  const { level, xpIntoLevel, xpForNextLevel } = levelFromXP(totalXP)
  const since = new Date(createdAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl text-white" style={{ background: 'linear-gradient(135deg, #2fb9a8, #168e83)', boxShadow: '0 5px 0 #0d7069' }}>
        <BannerPattern />
        <div className="relative flex flex-col items-center gap-4 px-6 py-6 sm:flex-row">
          <div className="rounded-full bg-white/20 p-2">
            <Mascot mood="happy" size={104} accessories={equippedCosmetics} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            {editingName ? (
              <form
                className="flex items-center justify-center gap-2 sm:justify-start"
                onSubmit={(e) => {
                  e.preventDefault()
                  setName(nameDraft)
                  setEditingName(false)
                }}
              >
                <input
                  autoFocus
                  value={nameDraft}
                  maxLength={24}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setEditingName(false)}
                  className="w-48 rounded-xl border-2 border-white/40 bg-black/20 px-3 py-1 text-xl font-black text-white outline-none"
                  aria-label="Name"
                />
                <button type="submit" className="rounded-xl bg-white/25 px-3 py-1.5 text-sm font-extrabold">OK</button>
              </form>
            ) : (
              <button onClick={() => { setNameDraft(name); setEditingName(true) }} className="group flex items-center gap-2" title="Namen ändern">
                <h1 className="text-3xl font-black">{name}</h1>
                <span className="opacity-60 transition-opacity group-hover:opacity-100"><Icon name="pencil" size={20} /></span>
              </button>
            )}
            <div className="text-sm font-semibold opacity-90">Dabei seit {since}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-extrabold sm:justify-start">
              <span className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1"><Icon name="star" size={14} /> Level {level}</span>
              <span className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1"><Icon name="flame" size={14} /> {currentStreak} Tage</span>
              <span className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1">{LEAGUES[leagueDivisionIndex].name}</span>
            </div>
            <div className="mt-3 max-w-xs">
              <div className="mb-1 text-[11px] font-bold opacity-90">{xpIntoLevel} / {xpForNextLevel} EP bis Level {level + 1}</div>
              <div className="h-2.5 overflow-hidden rounded-full bg-black/15">
                <div className="h-full rounded-full bg-white" style={{ width: `${(xpIntoLevel / xpForNextLevel) * 100}%` }} />
              </div>
            </div>
          </div>
          <LeagueBadge index={leagueDivisionIndex} size={64} />
        </div>
      </div>

      <h2 className="mb-3 text-lg font-extrabold">Statistiken</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon="flame" label="Tage Serie" value={currentStreak} sub={`Rekord ${longestStreak}`} />
        <Stat icon="star" label="Gesamt-EP" value={totalXP.toLocaleString('de-DE')} />
        <Stat icon="bolt" label="Beste WPM" value={bestWpm} />
        <Stat icon="book" label="Lektionen" value={lessonsCompleted} />
        <Stat icon="keyboard" label="Zeichen getippt" value={totalCharsTyped.toLocaleString('de-DE')} />
        <Stat icon="target" label="Perfekte Lektionen" value={perfectLessons} />
      </div>

      <button onClick={() => startPractice(ABC_TEXT)} className="tile tile-hover mb-8 flex w-full items-center gap-4 p-4 text-left">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: '#6366f11f' }}>
          <Icon name="abc" size={40} />
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">ABC-Durchlauf</span>
          <span className="block text-sm" style={{ color: 'var(--text-muted)' }}>Einmal das ganze Alphabet tippen – a bis ß, dann alle Großbuchstaben. Die Hände zeigen dir jeden Finger.</span>
        </span>
        <Icon name="chevron" size={20} className="opacity-40" />
      </button>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Icon name="calendar" size={24} /> Aktivität</h2>
      <ActivityCalendar log={sessionLog} />

      <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-extrabold"><Icon name="chart" size={24} /> Dein Tempo</h2>
      <WpmChart log={sessionLog} />

      <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-extrabold"><Icon name="keyboard" size={24} /> Tasten-Heatmap</h2>
      <KeyHeatmap keyStats={keyStats} />

      <h2 className="mb-3 mt-8 text-lg font-extrabold">Fortschritt pro Einheit</h2>
      <div className="tile mb-8 flex flex-col gap-3 p-4">
        {CURRICULUM.map((unit) => {
          const done = unit.lessons.filter((l) => (lessonProgress[l.id]?.crownLevel ?? 0) > 0).length
          const pct = Math.round((done / unit.lessons.length) * 100)
          return (
            <div key={unit.id} className="flex items-center gap-3">
              <Icon name={unit.icon} size={28} muted={done === 0} />
              <span className="w-32 shrink-0 text-sm font-bold leading-tight sm:w-40">{unit.title}</span>
              <div className="flex-1">
                <Bar pct={pct} color={unit.color} />
              </div>
              <span className="w-9 text-right text-xs font-extrabold" style={{ color: 'var(--text-muted)' }}>{done}/{unit.lessons.length}</span>
            </div>
          )
        })}
      </div>

      <h2 className="mb-3 text-lg font-extrabold">Einstellungen</h2>
      <div className="tile flex flex-col divide-y-2" style={{ borderColor: 'var(--border)' }}>
        <SettingRow icon="sound" label="Soundeffekte" active={soundEnabled} onClick={toggleSound} />
        <SettingRow icon="sparkle" label="Hände über der Tastatur" active={showHands} onClick={() => setSetting('showHands', !showHands)} />
        <SettingRow icon="keyboard" label="Bildschirm-Tastatur" active={showKeyboard} onClick={() => setSetting('showKeyboard', !showKeyboard)} />
        <SettingRow icon="target" label="Fingeranzeige" active={showFingerGuide} onClick={() => setSetting('showFingerGuide', !showFingerGuide)} />
        <SettingRow icon="abc" label="Großer Übungstext" active={bigText} onClick={() => setSetting('bigText', !bigText)} />
        <button onClick={exportSave} className="flex items-center gap-3 px-4 py-3 text-left font-bold" style={{ borderColor: 'var(--border)' }}>
          <Icon name="chest" size={26} />
          <span className="flex-1">
            Fortschritt sichern
            <span className="block text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Lädt eine Backup-Datei herunter – z. B. für einen anderen PC</span>
          </span>
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-3 px-4 py-3 text-left font-bold" style={{ borderColor: 'var(--border)' }}>
          <Icon name="repeat" size={26} />
          <span className="flex-1">Fortschritt laden</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void loadSave(f)
              e.target.value = ''
            }}
          />
        </button>
        <button onClick={() => setView('placement')} className="flex items-center gap-3 px-4 py-3 text-left font-bold" style={{ borderColor: 'var(--border)' }}>
          <Icon name="rocket" size={26} />
          <span className="flex-1">Einstufungstest erneut machen</span>
          <Icon name="chevron" size={18} className="opacity-40" />
        </button>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="flex items-center gap-3 px-4 py-3 text-left font-bold" style={{ borderColor: 'var(--border)', color: '#ff4b4b' }}>
            <Icon name="warning" size={26} />
            <span className="flex-1">Fortschritt zurücksetzen</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 p-3" style={{ borderColor: 'var(--border)' }}>
            <Icon name="warning" size={26} />
            <span className="flex-1 text-sm font-bold" style={{ color: '#ff4b4b' }}>Wirklich alles zurücksetzen?</span>
            <button onClick={() => { resetProgress(); setConfirmReset(false) }} className="btn-3d px-3 py-1.5 text-xs text-white" style={{ background: '#ff4b4b', ['--btn-edge' as string]: '#d93636' }}>Ja</button>
            <button onClick={() => setConfirmReset(false)} className="btn-3d border-2 px-3 py-1.5 text-xs" style={{ borderColor: 'var(--border)', ['--btn-edge' as string]: 'var(--border)' }}>Nein</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="tile flex items-center gap-3 p-3">
      <Icon name={icon} size={34} />
      <div className="min-w-0">
        <div className="text-xl font-black leading-tight">{value}</div>
        <div className="truncate text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>{label}</div>
        {sub && <div className="truncate text-[10px] font-semibold" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>{sub}</div>}
      </div>
    </div>
  )
}

function SettingRow({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderColor: 'var(--border)' }}>
      <Icon name={icon} size={26} />
      <span className="flex-1 font-bold">{label}</span>
      <button
        onClick={onClick}
        role="switch"
        aria-checked={active}
        aria-label={label}
        className="h-7 w-12 rounded-full p-0.5 transition-colors"
        style={{ background: active ? '#2fb9a8' : 'var(--kb-key-bg)', boxShadow: 'inset 0 2px 0 rgba(0,0,0,.08)' }}
      >
        <span className="block h-6 w-6 rounded-full bg-white shadow transition-transform" style={{ transform: active ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    </div>
  )
}

/** GitHub-style calendar of the last 18 weeks: the more EP on a day, the stronger the green */
function ActivityCalendar({ log }: { log: SessionLogEntry[] }) {
  const WEEKS = 18
  const xpByDay = new Map<string, number>()
  for (const e of log) xpByDay.set(e.d, (xpByDay.get(e.d) ?? 0) + e.xp)
  const today = new Date(todayISO() + 'T00:00:00Z')
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - ((today.getUTCDay() + 6) % 7) - (WEEKS - 1) * 7)
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return { iso, xp: xpByDay.get(iso) ?? 0, future: d > today }
  })
  const activeDays = days.filter((d) => d.xp > 0).length
  const color = (xp: number) => (xp === 0 ? 'var(--kb-key-bg)' : xp < 15 ? '#c6f0a0' : xp < 40 ? '#89e219' : xp < 80 ? '#2fb9a8' : '#0d7069')
  return (
    <div className="tile p-4">
      <div className="flex justify-center gap-[3px] overflow-x-auto pb-1 scrollbar-thin">
        <div className="mr-1 flex flex-col justify-between py-[1px] text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>
          <span>Mo</span><span>Mi</span><span>Fr</span><span>So</span>
        </div>
        {Array.from({ length: WEEKS }, (_, w) => (
          <div key={w} className="flex min-w-[12px] max-w-[22px] flex-1 flex-col gap-[3px]">
            {days.slice(w * 7, w * 7 + 7).map((d) => (
              <span
                key={d.iso}
                title={`${new Date(d.iso).toLocaleDateString('de-DE')}: ${d.xp} EP`}
                className="aspect-square w-full rounded-[4px]"
                style={{ background: d.future ? 'transparent' : color(d.xp), outline: d.iso === todayISO() ? '2px solid #e68743' : undefined }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
        <span>{activeDays} aktive Tage in den letzten {WEEKS} Wochen</span>
        <span className="flex items-center gap-1">
          weniger
          {[0, 10, 30, 60, 100].map((x) => <span key={x} className="h-3 w-3 rounded-[3px]" style={{ background: color(x) }} />)}
          mehr
        </span>
      </div>
    </div>
  )
}

/** line chart of the words per minute of the last sessions */
function WpmChart({ log }: { log: SessionLogEntry[] }) {
  const pts = log.slice(-24)
  if (pts.length < 2) {
    return (
      <div className="tile flex items-center gap-4 p-5">
        <Mascot mood="neutral" size={64} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          Sobald du ein paar Lektionen getippt hast, siehst du hier, wie dein Tempo (Wörter pro Minute) mit der Zeit steigt.
        </p>
      </div>
    )
  }
  const W = 600
  const H = 180
  const P = { l: 34, r: 12, t: 14, b: 22 }
  const max = Math.max(10, Math.ceil(Math.max(...pts.map((p) => p.wpm)) / 10) * 10)
  const x = (i: number) => P.l + (i / (pts.length - 1)) * (W - P.l - P.r)
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(p.wpm).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(pts.length - 1)} ${H - P.b} L ${x(0)} ${H - P.b} Z`
  const avg = Math.round(pts.reduce((a, p) => a + p.wpm, 0) / pts.length)
  const first = pts[0].wpm
  const last = pts[pts.length - 1].wpm
  return (
    <div className="tile p-4">
      <div className="mb-2 flex flex-wrap gap-2 text-xs font-extrabold">
        <span className="rounded-full px-2.5 py-1" style={{ background: 'var(--kb-key-bg)' }}>Ø {avg} WPM</span>
        <span className="rounded-full px-2.5 py-1" style={{ background: 'var(--kb-key-bg)', color: last >= first ? '#58a700' : '#ff4b4b' }}>
          {last >= first ? '+' : ''}{last - first} WPM seit Beginn
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Verlauf deiner Tippgeschwindigkeit">
        <defs>
          <linearGradient id="wpmfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#35c7b5" stopOpacity="0.35" />
            <stop offset="1" stopColor="#35c7b5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 5" />
            <text x={P.l - 8} y={y(max * f) + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--text-muted)">{Math.round(max * f)}</text>
          </g>
        ))}
        <path d={area} fill="url(#wpmfill)" />
        <path d={line} fill="none" stroke="#35c7b5" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.wpm)} r={i === pts.length - 1 ? 6 : 3.5} fill={i === pts.length - 1 ? '#e68743' : '#35c7b5'} stroke="var(--bg-elevated)" strokeWidth="2">
            <title>{`${p.wpm} WPM · ${p.acc}%`}</title>
          </circle>
        ))}
        <text x={W - P.r} y={H - 4} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--text-muted)">letzte {pts.length} Sitzungen</text>
      </svg>
    </div>
  )
}
