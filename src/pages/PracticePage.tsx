import { useStore, unlockedKeysForPlayer, weakestKeys } from '../store/useStore'
import { generateWeakKeyPractice, generateSpeedTestText } from '../engine/textGenerator'
import { generateLessonText } from '../engine/textGenerator'
import { ALL_LESSON_IDS } from '../data/curriculum'
import { FINGER_LABEL, fingerFor } from '../data/keyboard'
import Mascot from '../components/Mascot'

export default function PracticePage() {
  const startPractice = useStore((s) => s.startPractice)
  const startSpeedTest = useStore((s) => s.startSpeedTest)
  const lessonProgress = useStore((s) => s.lessonProgress)
  const keyStats = useStore((s) => s.keyStats)

  const unlocked = unlockedKeysForPlayer()
  const weak = weakestKeys(6)

  const practiceWeak = () => {
    const { text } = generateWeakKeyPractice(weak, unlocked, 140)
    startPractice(text)
  }

  const practiceRandomReview = () => {
    const done = ALL_LESSON_IDS.filter((id) => (lessonProgress[id]?.crownLevel ?? 0) > 0)
    if (done.length === 0) return
    const pick = done[Math.floor(Math.random() * done.length)]
    const { text } = generateLessonText(pick, 1, 'review')
    startPractice(text)
  }

  const speedTest = () => {
    const { text } = generateSpeedTestText(unlocked.length ? unlocked : ['a', 's', 'd', 'f'], 220)
    startSpeedTest(text)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Mascot mood="neutral" size={56} />
        <div>
          <h1 className="text-xl font-extrabold">Practice Hub</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kostenloses Training – ganz ohne Druck, ganz ohne Grenzen.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          icon="🧠"
          title="Schwache Tasten"
          desc={weak.length ? `Fokus: ${weak.join(' ').toUpperCase()}` : 'Noch keine Daten – tippe ein paar Lektionen!'}
          onClick={practiceWeak}
          color="#ef4444"
        />
        <Card icon="🔁" title="Zufällige Wiederholung" desc="Wiederhole eine bereits gelernte Lektion." onClick={practiceRandomReview} color="#8b5cf6" />
        <Card icon="⚡" title="Geschwindigkeitstest" desc="Wie viele WPM schaffst du in einem Textabschnitt?" onClick={speedTest} color="#0ea5e9" />
        <Card icon="🎹" title="Freies Tippen" desc="Ein zufälliger Übungstext mit deinem aktuellen Wortschatz." onClick={practiceRandomReview} color="#22c55e" />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-extrabold">Deine Fehler-Heatmap</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(keyStats)
          .filter(([, v]) => v.attempts >= 3)
          .sort((a, b) => b[1].errors / b[1].attempts - a[1].errors / a[1].attempts)
          .slice(0, 14)
          .map(([ch, v]) => {
            const rate = v.errors / v.attempts
            const bg = rate > 0.25 ? '#ef4444' : rate > 0.1 ? '#f59e0b' : rate > 0 ? '#facc15' : '#22c55e'
            return (
              <div
                key={ch}
                title={`${FINGER_LABEL[fingerFor(ch)]} – ${Math.round(rate * 100)}% Fehlerquote`}
                className="flex h-11 w-11 flex-col items-center justify-center rounded-lg text-sm font-extrabold text-white"
                style={{ background: bg }}
              >
                {ch === ' ' ? '␣' : ch.toUpperCase()}
              </div>
            )
          })}
        {Object.keys(keyStats).length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tippe ein paar Lektionen, um deine Statistik zu sehen.</p>
        )}
      </div>
    </div>
  )
}

function Card({ icon, title, desc, onClick, color }: { icon: string; title: string; desc: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="btn-press flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full text-xl" style={{ background: `${color}22` }}>{icon}</span>
      <span className="font-extrabold">{title}</span>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</span>
    </button>
  )
}
