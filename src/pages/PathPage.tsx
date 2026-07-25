import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { CURRICULUM, ALL_LESSON_IDS, lessonIndex } from '../data/curriculum'
import Mascot from '../components/Mascot'
import RightRail from '../components/RightRail'

const OFFSETS = [0, 64, 96, 64, 0, -64, -96, -64]

export default function PathPage() {
  const lessonProgress = useStore((s) => s.lessonProgress)
  const startPathLesson = useStore((s) => s.startPathLesson)
  const pushToast = useStore((s) => s.pushToast)
  const setView = useStore((s) => s.setView)
  const name = useStore((s) => s.name)
  const placementDone = useStore((s) => s.placementDone)
  const equippedCosmetics = useStore((s) => s.equippedCosmetics)
  const streak = useStore((s) => s.currentStreak)

  const isUnlocked = (lessonId: string) => {
    const idx = lessonIndex(lessonId)
    if (idx <= 0) return true
    const prevId = ALL_LESSON_IDS[idx - 1]
    return (lessonProgress[prevId]?.crownLevel ?? 0) > 0
  }

  const nextLessonId = useMemo(() => {
    return ALL_LESSON_IDS.find((id) => (lessonProgress[id]?.crownLevel ?? 0) === 0 && isUnlocked(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonProgress])

  const handleClick = (lessonId: string, unlocked: boolean) => {
    if (!unlocked) {
      pushToast({ icon: '🔒', title: 'Noch gesperrt', subtitle: 'Schließe die vorherige Lektion ab.', tone: 'warning' })
      return
    }
    startPathLesson(lessonId)
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 pb-12 pt-6">
      <div className="mx-auto w-full max-w-2xl">
        {!placementDone && (
          <button
            onClick={() => setView('placement')}
            className="pop-in mb-6 flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-transform hover:-translate-y-0.5"
            style={{ borderColor: 'var(--accent)', background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}
          >
            <span className="icon-badge h-12 w-12 text-2xl" style={{ background: 'color-mix(in srgb, var(--accent) 20%, var(--bg-elevated))' }}>🚀</span>
            <div>
              <div className="font-extrabold">Schon Tipp-Erfahrung?</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Mach den Einstufungstest und spring direkt zu deinem Level!</div>
            </div>
          </button>
        )}

        <div className="card-surface mb-8 flex items-center gap-4 rounded-2xl p-4">
          <Mascot mood={streak > 0 ? 'happy' : 'neutral'} size={64} accessories={equippedCosmetics} />
          <div>
            <div className="font-extrabold">Hallo, {name}! 👋</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {streak > 0 ? `${streak} Tage Serie – weiter so!` : 'Starte heute deine Tipp-Serie!'}
            </div>
          </div>
        </div>

        {CURRICULUM.map((unit) => (
          <section key={unit.id} className="mb-10">
            <div
              className="mb-6 rounded-2xl px-5 py-4 text-white"
              style={{ background: `linear-gradient(135deg, ${unit.color}, ${unit.color}cc)`, boxShadow: `0 10px 28px -14px ${unit.color}88` }}
            >
              <div className="flex items-center gap-2 text-lg font-extrabold">
                <span className="icon-badge h-9 w-9 text-xl" style={{ background: 'rgba(255,255,255,0.22)' }}>{unit.icon}</span>
                {unit.title}
              </div>
              <div className="text-sm opacity-90">{unit.subtitle}</div>
            </div>

            <div className="flex flex-col items-center gap-5">
              {unit.lessons.map((lesson, li) => {
                const progress = lessonProgress[lesson.id]
                const crownLevel = progress?.crownLevel ?? 0
                const unlocked = isUnlocked(lesson.id)
                const isNext = lesson.id === nextLessonId
                const offset = OFFSETS[li % OFFSETS.length]
                return (
                  <div key={lesson.id} className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
                    {isNext && (
                      <div
                        className="pop-in absolute -top-10 rounded-xl px-3 py-1 text-xs font-extrabold text-white shadow"
                        style={{ background: unit.color }}
                      >
                        START
                        <div
                          className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45"
                          style={{ background: unit.color }}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleClick(lesson.id, unlocked)}
                      className={`relative flex h-16 w-16 items-center justify-center rounded-full text-2xl transition-transform hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem] ${isNext ? 'pulse-ring' : ''}`}
                      style={{
                        background: unlocked ? `linear-gradient(145deg, ${unit.color}, ${unit.color}cc)` : 'var(--kb-key-bg)',
                        color: unlocked ? 'white' : 'var(--text-muted)',
                        opacity: unlocked ? 1 : 0.7,
                        border: unlocked ? 'none' : '2px solid var(--border)',
                        boxShadow: unlocked ? `0 8px 20px -8px ${unit.color}aa, inset 0 -3px 0 rgba(0,0,0,0.15)` : 'var(--card-shadow)',
                      }}
                    >
                      {unlocked ? lesson.icon : '🔒'}
                      {crownLevel > 0 && (
                        <span
                          className="absolute -bottom-2 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold text-amber-600"
                          style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}
                        >
                          👑{crownLevel}
                        </span>
                      )}
                    </button>
                    <span className="mt-2 max-w-24 text-center text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                      {lesson.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <div className="flex flex-col items-center gap-2 pb-6 pt-4 text-center" style={{ color: 'var(--text-muted)' }}>
          <span className="text-4xl">🏁</span>
          <span className="font-bold">Das war's fürs Erste!</span>
          <span className="text-sm">Weitere Kurse folgen bald.</span>
        </div>
      </div>

      <RightRail />
    </div>
  )
}
