import { useState } from 'react'
import { useStore } from '../store/useStore'
import { CURRICULUM } from '../data/curriculum'
import Mascot from '../components/Mascot'

export default function ProfilePage() {
  const name = useStore((s) => s.name)
  const totalXP = useStore((s) => s.totalXP)
  const bestWpm = useStore((s) => s.bestWpm)
  const longestStreak = useStore((s) => s.longestStreak)
  const currentStreak = useStore((s) => s.currentStreak)
  const lessonsCompleted = useStore((s) => s.lessonsCompleted)
  const totalCharsTyped = useStore((s) => s.totalCharsTyped)
  const perfectLessons = useStore((s) => s.perfectLessons)
  const lessonProgress = useStore((s) => s.lessonProgress)
  const equippedCosmetics = useStore((s) => s.equippedCosmetics)
  const soundEnabled = useStore((s) => s.soundEnabled)
  const toggleSound = useStore((s) => s.toggleSound)
  const darkMode = useStore((s) => s.darkMode)
  const darkModeUnlocked = useStore((s) => s.darkModeUnlocked)
  const toggleDarkMode = useStore((s) => s.toggleDarkMode)
  const resetProgress = useStore((s) => s.resetProgress)
  const setView = useStore((s) => s.setView)

  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}>
        <Mascot mood="happy" size={100} accessories={equippedCosmetics} />
        <h1 className="text-xl font-extrabold">{name}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>🔥 {currentStreak} Tage Serie · Rekord {longestStreak}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon="⭐" label="Gesamt-EP" value={totalXP} />
        <Stat icon="⚡" label="Beste WPM" value={bestWpm} />
        <Stat icon="📘" label="Lektionen" value={lessonsCompleted} />
        <Stat icon="⌨️" label="Zeichen getippt" value={totalCharsTyped.toLocaleString('de-DE')} />
        <Stat icon="💯" label="Perfekte Lektionen" value={perfectLessons} />
        <Stat icon="🔥" label="Bestwert Serie" value={longestStreak} />
      </div>

      <h2 className="mb-3 text-lg font-extrabold">Fortschritt pro Unit</h2>
      <div className="mb-8 flex flex-col gap-2">
        {CURRICULUM.map((unit) => {
          const done = unit.lessons.filter((l) => (lessonProgress[l.id]?.crownLevel ?? 0) > 0).length
          const pct = Math.round((done / unit.lessons.length) * 100)
          return (
            <div key={unit.id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-xs font-bold leading-tight sm:w-44 sm:text-sm">{unit.icon} {unit.title}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: unit.color }} />
              </div>
              <span className="w-10 text-right text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{done}/{unit.lessons.length}</span>
            </div>
          )
        })}
      </div>

      <h2 className="mb-3 text-lg font-extrabold">Einstellungen</h2>
      <div className="flex flex-col gap-2">
        <SettingRow label="🔊 Soundeffekte" active={soundEnabled} onClick={toggleSound} />
        <SettingRow label="🌙 Dark Mode" active={darkMode} onClick={toggleDarkMode} disabled={!darkModeUnlocked} disabledHint="Im Shop freischalten" />
        <button
          onClick={() => setView('placement')}
          className="rounded-xl border px-4 py-3 text-left font-bold"
          style={{ borderColor: 'var(--border)' }}
        >
          🚀 Einstufungstest erneut machen
        </button>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="rounded-xl border px-4 py-3 text-left font-bold text-rose-500" style={{ borderColor: 'var(--border)' }}>
            ⚠️ Fortschritt zurücksetzen
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-rose-400 p-3">
            <span className="flex-1 text-sm font-bold text-rose-500">Wirklich alles zurücksetzen?</span>
            <button onClick={() => { resetProgress(); setConfirmReset(false) }} className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-bold text-white">Ja</button>
            <button onClick={() => setConfirmReset(false)} className="rounded-lg border px-3 py-1.5 text-sm font-bold">Nein</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border p-3 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}>
      <span className="text-xl">{icon}</span>
      <span className="text-lg font-extrabold">{value}</span>
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

function SettingRow({ label, active, onClick, disabled, disabledHint }: { label: string; active: boolean; onClick: () => void; disabled?: boolean; disabledHint?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
      <span className="font-bold">{label}</span>
      {disabled ? (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{disabledHint}</span>
      ) : (
        <button
          onClick={onClick}
          className="h-6 w-11 rounded-full p-0.5 transition-colors"
          style={{ background: active ? 'var(--primary)' : 'var(--kb-key-bg)' }}
        >
          <span className="block h-5 w-5 rounded-full bg-white shadow transition-transform" style={{ transform: active ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      )}
    </div>
  )
}
