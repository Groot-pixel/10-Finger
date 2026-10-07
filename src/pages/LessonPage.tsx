import { useEffect, useMemo, useState } from 'react'
import TypingArea from '../components/TypingArea'
import Mascot from '../components/Mascot'
import Icon from '../components/Icon'
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
          <Stat label="WPM" value={result.wpm} icon="bolt" color="#ffc800" />
          <Stat label="Genauigkeit" value={`${result.accuracy}%`} icon="target" color="#58cc02" />
          <Stat label="Zeichen" value={result.charsTyped} icon="keyboard" color="#1cb0f6" />
          <Stat label="Combo" value={result.maxCombo} icon="flame" color="#ff9600" />
        </div>

        {session.kind !== 'placement' && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-lg font-bold">
            {reward.xpEarned > 0 && <span className="flex items-center gap-1" style={{ color: '#ce82ff' }}><Icon name="star" size={24} />+{reward.xpEarned} EP</span>}
            {reward.gemsEarned > 0 && <span className="flex items-center gap-1" style={{ color: '#1cb0f6' }}><Icon name="gem" size={24} />+{reward.gemsEarned}</span>}
            {reward.crownUp && <span className="flex items-center gap-1" style={{ color: '#e5a400' }}><Icon name="crown" size={24} />Krone verdient!</span>}
          </div>
        )}
        {session.kind === 'placement' && (
          <div className="flex gap-4 text-lg font-bold">
            <span className="flex items-center gap-1" style={{ color: '#1cb0f6' }}><Icon name="gem" size={24} />+25 Willkommensbonus</span>
          </div>
        )}

        {session.kind !== 'placement' && (
          <div className="flex items-center gap-1 rounded-full px-3 py-1.5" style={{ background: 'var(--kb-key-bg)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon key={i} name="heart" size={20} muted={i >= reward.precisionHearts} />
            ))}
            <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {reward.precisionHearts === 5 ? 'Makellose Präzision!' : `Präzisions-Bonus: +${reward.precisionHearts} Gems`}
            </span>
          </div>
        )}

        {!passed && session.kind === 'path' && (
          <p style={{ color: 'var(--text-muted)' }}>Fast geschafft – für die Krone brauchst du mindestens 70% Genauigkeit. Kein Stress, probier's einfach nochmal!</p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { cancelSession(); setView('path') }}
            className="btn-3d min-w-40 px-6 py-3 text-white"
            style={{ background: '#58cc02', ['--btn-edge' as string]: '#46a302' }}
          >
            {session.kind === 'placement' ? 'Zum Lernpfad' : 'Weiter'}
          </button>
          {session.kind === 'path' && (
            <button
              onClick={() => { setResult(null); setReward(null) }}
              className="btn-3d min-w-40 border-2 px-6 py-3"
              style={{ borderColor: 'var(--border)', color: '#1cb0f6', ['--btn-edge' as string]: 'var(--border)' }}
            >
              Nochmal üben
            </button>
          )}
        </div>
        {unit && <p className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--text-muted)' }}><Icon name={unit.icon} size={18} /> {unit.title}</p>}
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

/** result card in the style of Duolingo: coloured frame with the label on top */
function Stat({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="pop-in overflow-hidden rounded-2xl border-2" style={{ borderColor: color, background: color }}>
      <div className="py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">{label}</div>
      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-t-xl px-2 py-3 text-lg font-black" style={{ background: 'var(--bg-elevated)', color }}>
        <Icon name={icon} size={22} />
        {value}
      </div>
    </div>
  )
}
