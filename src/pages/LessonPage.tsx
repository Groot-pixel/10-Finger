import { useEffect, useMemo, useState } from 'react'
import TypingArea from '../components/TypingArea'
import Mascot from '../components/Mascot'
import Confetti from '../components/Confetti'
import { useStore } from '../store/useStore'
import { generateLessonText } from '../engine/textGenerator'
import { lessonById } from '../data/curriculum'
import type { LessonResult } from '../types'

const ENCOURAGEMENTS = [
  'Stark gemacht!', 'Weiter so!', 'Du wirst immer schneller!', 'Fantastisch!', 'Grandios!',
]
const COMFORT = [
  'Nicht schlimm, Übung macht den Meister!', 'Beim nächsten Mal klappt es besser!', 'Dranbleiben lohnt sich!',
]

export default function LessonPage() {
  const session = useStore((s) => s.activeSession)
  const cancelSession = useStore((s) => s.cancelSession)
  const completeLesson = useStore((s) => s.completeLesson)
  const applyPlacement = useStore((s) => s.applyPlacement)
  const setView = useStore((s) => s.setView)
  const lessonProgress = useStore((s) => s.lessonProgress)

  const [result, setResult] = useState<LessonResult | null>(null)
  const [reward, setReward] = useState<{ xpEarned: number; gemsEarned: number; crownUp: boolean; precisionHearts: number } | null>(null)

  const text = useMemo(() => {
    if (!session) return ''
    if (session.kind === 'path' && session.lessonId) {
      const crownLevel = lessonProgress[session.lessonId]?.crownLevel ?? 0
      return generateLessonText(session.lessonId, crownLevel).text
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
    return session.text ?? ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.kind, session?.lessonId])

  useEffect(() => {
    setResult(null)
    setReward(null)
  }, [session])

  if (!session) return null

  const handleFinish = (partial: Omit<LessonResult, 'lessonId'>) => {
    const full: LessonResult = { ...partial, lessonId: session.lessonId ?? session.kind }

    if (session.kind === 'placement') {
      // score-based unit suggestion
      let suggestedUnit = 0
      if (partial.wpm >= 15 || partial.accuracy >= 80) suggestedUnit = 1
      if (partial.wpm >= 25 && partial.accuracy >= 85) suggestedUnit = 3
      if (partial.wpm >= 35 && partial.accuracy >= 90) suggestedUnit = 5
      if (partial.wpm >= 50 && partial.accuracy >= 93) suggestedUnit = 7
      if (partial.wpm >= 65 && partial.accuracy >= 95) suggestedUnit = 9
      applyPlacement(suggestedUnit)
      setResult(full)
      setReward({ xpEarned: 0, gemsEarned: 25, crownUp: false, precisionHearts: 5 })
      return
    }

    const isPractice = session.kind !== 'path'
    const r = completeLesson({ ...full, isPractice })
    setResult(full)
    setReward(r)
  }

  if (result && reward) {
    const passed = session.kind === 'placement' || result.accuracy >= 70
    const unit = session.lessonId ? lessonById(session.lessonId)?.unit : undefined

    return (
      <div className="relative flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        {passed && <Confetti />}
        <Mascot mood={passed ? 'excited' : 'sad'} size={120} bounce />
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          {session.kind === 'placement'
            ? 'Einstufung abgeschlossen!'
            : passed
              ? ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
              : COMFORT[Math.floor(Math.random() * COMFORT.length)]}
        </h2>

        <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="WPM" value={result.wpm} icon="⚡" />
          <Stat label="Genauigkeit" value={`${result.accuracy}%`} icon="🎯" />
          <Stat label="Zeichen" value={result.charsTyped} icon="⌨️" />
          <Stat label="Max. Combo" value={result.maxCombo} icon="🔥" />
        </div>

        {session.kind !== 'placement' && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-lg font-bold">
            {reward.xpEarned > 0 && <span style={{ color: 'var(--primary)' }}>+{reward.xpEarned} EP</span>}
            {reward.gemsEarned > 0 && <span className="text-sky-500">+{reward.gemsEarned} 💎</span>}
            {reward.crownUp && <span className="text-amber-500">👑 Level up!</span>}
          </div>
        )}
        {session.kind === 'placement' && (
          <div className="flex gap-4 text-lg font-bold">
            <span className="text-sky-500">+25 💎 Willkommensbonus</span>
          </div>
        )}

        {session.kind !== 'placement' && (
          <div className="flex items-center gap-1 rounded-full px-3 py-1.5" style={{ background: 'var(--kb-key-bg)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ opacity: i < reward.precisionHearts ? 1 : 0.25 }}>❤️</span>
            ))}
            <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {reward.precisionHearts === 5 ? 'Makellose Präzision!' : `Präzisions-Bonus: +${reward.precisionHearts} 💎`}
            </span>
          </div>
        )}

        {!passed && session.kind === 'path' && (
          <p style={{ color: 'var(--text-muted)' }}>Fast geschafft – für die Krone brauchst du mindestens 70% Genauigkeit. Kein Stress, probier's einfach nochmal!</p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { cancelSession(); setView('path') }}
            className="btn-press rounded-2xl px-6 py-3 font-bold text-white shadow"
            style={{ background: 'var(--primary)' }}
          >
            {session.kind === 'placement' ? 'Zum Lernpfad' : 'Weiter'}
          </button>
          {session.kind === 'path' && (
            <button
              onClick={() => { setResult(null); setReward(null) }}
              className="btn-press rounded-2xl border px-6 py-3 font-bold"
              style={{ borderColor: 'var(--border)' }}
            >
              Nochmal üben
            </button>
          )}
        </div>
        {unit && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{unit.icon} {unit.title}</p>}
      </div>
    )
  }

  if (!text) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Mascot mood="neutral" bounce />
      </div>
    )
  }

  return (
    <div className="py-6">
      <TypingArea
        key={text}
        text={text}
        onFinish={handleFinish}
        onAbort={() => { cancelSession(); setView('path') }}
      />
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="pop-in flex flex-col items-center gap-1 rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xl font-extrabold">{value}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
