import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { CURRICULUM, ALL_LESSON_IDS, lessonIndex, type LessonType, type UnitDef } from '../data/curriculum'
import { CHAR_FINGER_MAP, FINGER_COLOR, FINGER_LABEL, type FingerId } from '../data/keyboard'
import Mascot, { type MascotMood } from '../components/Mascot'
import RightRail from '../components/RightRail'
import Icon from '../components/Icon'
import { BannerPattern, KeycapCluster} from '../components/Art'
import { shade } from '../utils/color'

/** horizontal zig-zag of the path (px), like a winding trail */
const OFFSETS = [0, 52, 84, 52, 0, -52, -84, -52]
const ROW = 108
const NODE = 72

const TYPE_ICON: Record<LessonType, string> = {
  drill: 'star',
  words: 'book',
  sentences: 'chat',
  numbers: 'numbers',
  punctuation: 'pencil',
  checkpoint: 'chest',
  boss: 'trophy',
}

/** short coaching tip per unit, shown in the unit's learning help */
const UNIT_TIPS: Record<string, string> = {
  u1: 'Lege die Zeigefinger auf F und J – du fühlst die kleinen Erhebungen. Die anderen Finger liegen locker daneben.',
  u2: 'Ring- und kleine Finger sind am schwächsten. Tippe langsam und gleichmäßig – Tempo kommt von allein.',
  u3: 'Der Finger wandert nach oben und kommt danach sofort auf seine Grundtaste zurück.',
  u4: 'Für Q, P und Ü streckt sich der kleine Finger – die Hand bleibt dabei ruhig liegen.',
  u5: 'Für die untere Reihe krümmst du den Finger leicht nach unten, der Handballen bleibt locker.',
  u6: 'Die Zahlenreihe ist weit weg: Schau nicht hin, sondern merke dir den Weg von der Grundreihe aus.',
  u7: 'Shift drückt immer der kleine Finger der anderen Hand. Großes O? → linke Shift-Taste.',
  u8: 'Satzzeichen tippen meist die kleinen Finger. Nach Punkt und Komma folgt ein Leerzeichen mit dem Daumen.',
  u9: 'Jetzt zählt der Rhythmus: lieber gleichmäßig als hektisch. Fehler kosten mehr Zeit als langsames Tippen.',
  u10: 'Du kannst alle Tasten! Jetzt geht es um Ausdauer – kurze Pausen helfen, locker zu bleiben.',
}

const SIDE_MOODS: MascotMood[] = ['happy', 'excited', 'love', 'happy', 'excited']

export default function PathPage() {
  const lessonProgress = useStore((s) => s.lessonProgress)
  const startPathLesson = useStore((s) => s.startPathLesson)
  const pushToast = useStore((s) => s.pushToast)
  const setView = useStore((s) => s.setView)
  const name = useStore((s) => s.name)
  const placementDone = useStore((s) => s.placementDone)
  const equippedCosmetics = useStore((s) => s.equippedCosmetics)
  const streak = useStore((s) => s.currentStreak)
  const [openGuide, setOpenGuide] = useState<string | null>(null)

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

  const doneCount = ALL_LESSON_IDS.filter((id) => (lessonProgress[id]?.crownLevel ?? 0) > 0).length

  const handleClick = (lessonId: string, unlocked: boolean) => {
    if (!unlocked) {
      pushToast({ icon: 'lock', title: 'Noch gesperrt', subtitle: 'Schließe die vorherige Lektion ab.', tone: 'warning' })
      return
    }
    startPathLesson(lessonId)
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-4 pb-16 pt-6">
      <div className="mx-auto w-full max-w-[34rem]">
        {!placementDone && (
          <button
            onClick={() => setView('placement')}
            className="pop-in mb-5 flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 p-4 text-left transition-transform hover:-translate-y-0.5"
            style={{ borderColor: 'color-mix(in srgb, var(--accent) 55%, var(--border))', background: 'var(--bg-elevated)' }}
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'color-mix(in srgb, var(--accent) 16%, var(--bg-elevated))' }}>
              <Icon name="rocket" size={38} />
            </span>
            <div className="flex-1">
              <div className="font-extrabold">Schon Tipp-Erfahrung?</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Mach den Einstufungstest und spring direkt zu deinem Level!</div>
            </div>
            <Icon name="chevron" size={20} className="opacity-40" />
          </button>
        )}

        {/* greeting with a speech bubble */}
        <div className="mb-8 flex items-end gap-3">
          <Mascot mood={streak > 0 ? 'happy' : 'neutral'} size={78} accessories={equippedCosmetics} bounce />
          <div className="relative mb-4 flex-1 rounded-2xl border-2 px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }} />
            <div className="font-extrabold">Hallo, {name}!</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {streak > 0 ? `${streak} Tage Serie – weiter so! ` : 'Starte heute deine Tipp-Serie! '}
              {doneCount > 0 ? `${doneCount} von ${ALL_LESSON_IDS.length} Lektionen geschafft.` : 'Los geht’s mit F und J.'}
            </div>
          </div>
        </div>

        {CURRICULUM.map((unit, ui) => {
          const flip = ui % 2 === 1
          const unitDone = unit.lessons.filter((l) => (lessonProgress[l.id]?.crownLevel ?? 0) > 0).length
          const unitStarted = unit.lessons.some((l) => isUnlocked(l.id))
          const dark = shade(unit.color, -0.25)
          const points = unit.lessons.map((_, li) => ({ x: (flip ? -1 : 1) * OFFSETS[li % OFFSETS.length], y: li * ROW + NODE / 2 + 62 }))
          const height = unit.lessons.length * ROW + 50
          return (
            <section key={unit.id} className="mb-12">
              {/* unit banner */}
              <div
                className="relative mb-4 overflow-hidden rounded-2xl px-5 py-4 text-white"
                style={{
                  background: unitStarted ? `linear-gradient(135deg, ${unit.color}, ${shade(unit.color, -0.08)})` : 'linear-gradient(135deg, #a8b3b8, #93a0a6)',
                  boxShadow: `0 4px 0 ${unitStarted ? dark : '#7c888e'}`,
                }}
              >
                <BannerPattern />
                <div className="relative flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">Einheit {ui + 1}</div>
                    <div className="text-xl font-black leading-tight">{unit.title}</div>
                    <div className="text-sm font-semibold opacity-90">{unit.subtitle}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2.5 w-28 overflow-hidden rounded-full bg-black/15">
                        <div className="h-full rounded-full bg-white" style={{ width: `${(unitDone / unit.lessons.length) * 100}%` }} />
                      </div>
                      <span className="text-xs font-extrabold">{unitDone}/{unit.lessons.length}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenGuide(openGuide === unit.id ? null : unit.id)}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-b-4 border-white/40 bg-white/15 px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide transition-transform hover:bg-white/25 active:translate-y-0.5"
                  >
                    <Icon name="lightbulb" size={26} />
                    Hilfe
                  </button>
                </div>
              </div>

              {openGuide === unit.id && <UnitGuide unit={unit} />}

              {/* the winding path */}
              <div className="relative mx-auto" style={{ height, width: '100%' }}>
                <svg className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 overflow-visible" width="1" height={height} aria-hidden="true">
                  {points.slice(1).map((p, i) => {
                    const a = points[i]
                    const done = (lessonProgress[unit.lessons[i].id]?.crownLevel ?? 0) > 0
                    return (
                      <path
                        key={i}
                        d={`M ${a.x} ${a.y} C ${a.x} ${a.y + ROW * 0.5}, ${p.x} ${p.y - ROW * 0.5}, ${p.x} ${p.y}`}
                        fill="none"
                        stroke={done ? unit.color : 'var(--border)'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="0.1 16"
                      />
                    )
                  })}
                </svg>

                {/* decoration on the open side of the trail */}
                <div
                  className="pointer-events-none absolute hidden sm:block"
                  style={{ top: ROW * 0.6, [flip ? 'right' : 'left']: 0 }}
                >
                  {ui % 2 === 0 ? (
                    <div className="flex flex-col items-center">
                      <Mascot mood={SIDE_MOODS[(ui / 2) % SIDE_MOODS.length]} size={110} accessories={equippedCosmetics} />
                      <div className="-mt-2 h-3 w-20 rounded-[50%]" style={{ background: 'color-mix(in srgb, var(--text) 8%, transparent)' }} />
                    </div>
                  ) : (
                    <KeycapCluster keys={unit.keys.length ? unit.keys : unit.lessons.flatMap((l) => l.newKeys)} color={unit.color} size={130} />
                  )}
                </div>

                {unit.lessons.map((lesson, li) => {
                  const crownLevel = lessonProgress[lesson.id]?.crownLevel ?? 0
                  const unlocked = isUnlocked(lesson.id)
                  const isNext = lesson.id === nextLessonId
                  const done = crownLevel > 0
                  const p = points[li]
                  const big = lesson.type === 'checkpoint' || lesson.type === 'boss'
                  const size = big ? NODE + 10 : NODE
                  const face = done ? '#ffc800' : unlocked ? unit.color : 'var(--kb-key-bg)'
                  const edge = done ? '#e5a400' : unlocked ? dark : 'var(--kb-key-shadow)'
                  return (
                    <div
                      key={lesson.id}
                      className="absolute flex flex-col items-center"
                      style={{ left: `calc(50% + ${p.x}px)`, top: p.y - size / 2, transform: 'translateX(-50%)' }}
                    >
                      {isNext && (
                        <div
                          className="bubble-bob absolute -top-11 whitespace-nowrap rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide"
                          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: unit.color }}
                        >
                          {done ? 'Wiederholen' : 'Start'}
                          <span
                            className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                          />
                        </div>
                      )}
                      {/* progress ring around the current lesson */}
                      {isNext && (
                        <svg className="absolute" width={size + 20} height={size + 20} style={{ top: -10 }} aria-hidden="true">
                          <circle cx={(size + 20) / 2} cy={(size + 20) / 2} r={size / 2 + 6} fill="none" stroke="var(--border)" strokeWidth="6" />
                        </svg>
                      )}
                      <button
                        onClick={() => handleClick(lesson.id, unlocked)}
                        title={lesson.title}
                        className="path-node relative flex items-center justify-center rounded-full"
                        style={{
                          width: size,
                          height: size - 6,
                          background: face,
                          boxShadow: `0 7px 0 ${edge}`,
                          ['--edge' as string]: edge,
                        }}
                      >
                        <span className="pointer-events-none absolute left-[18%] top-[14%] h-[22%] w-[30%] rotate-[-25deg] rounded-full bg-white" style={{ opacity: unlocked ? 0.3 : 0.5 }} />
                        <Icon
                          name={done ? 'check' : TYPE_ICON[lesson.type]}
                          size={big ? 40 : 34}
                          className={unlocked ? 'icon-white' : 'icon-locked'}
                        />
                        {done && crownLevel > 1 && (
                          <span className="absolute -bottom-3 -right-2 flex items-center gap-0.5 rounded-full border-2 px-1 text-[10px] font-extrabold" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: '#e5a400' }}>
                            <Icon name="crown" size={14} />
                            {crownLevel}
                          </span>
                        )}
                      </button>
                      <span className="mt-4 max-w-28 text-center text-[11px] font-extrabold leading-tight" style={{ color: unlocked ? 'var(--text)' : 'var(--text-muted)' }}>
                        {lesson.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        <div className="flex flex-col items-center gap-2 pb-6 pt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          <div className="relative">
            <Icon name="trophy" size={90} />
            <span className="absolute -right-4 top-0"><Icon name="sparkle" size={28} /></span>
          </div>
          <span className="text-lg font-extrabold" style={{ color: 'var(--text)' }}>Das Ziel: blind tippen wie ein Profi</span>
          <span className="max-w-xs text-sm">Schaffe alle Einheiten, um den Boss-Test freizuschalten und dir die goldene Trophäe zu holen.</span>
        </div>
      </div>

      <RightRail />
    </div>
  )
}

/** learning help for one unit: the keys of the unit, coloured by the finger that types them */
function UnitGuide({ unit }: { unit: UnitDef }) {
  const keys = unit.keys.length ? unit.keys : Array.from(new Set(unit.lessons.flatMap((l) => l.newKeys)))
  const fingers = Array.from(new Set(keys.map((k) => CHAR_FINGER_MAP[k]).filter(Boolean))) as FingerId[]
  return (
    <div className="pop-in mb-6 rounded-2xl border-2 p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
      <div className="mb-3 flex items-start gap-3">
        <Icon name="lightbulb" size={28} />
        <p className="text-sm font-semibold leading-snug">{UNIT_TIPS[unit.id]}</p>
      </div>
      {keys.length > 0 && (
        <>
          <div className="mb-2 flex flex-wrap gap-2">
            {keys.map((k) => {
              const color = FINGER_COLOR[CHAR_FINGER_MAP[k]] ?? '#94a3b8'
              return (
                <span
                  key={k}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-black text-white"
                  style={{ background: color, boxShadow: `0 3px 0 ${shade(color, -0.3)}`, textShadow: '0 1px 1px rgba(0,0,0,.25)' }}
                >
                  {k === 'ß' ? k : k.toUpperCase()}
                </span>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            {fingers.map((f) => (
              <span key={f} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: FINGER_COLOR[f] }} />
                {FINGER_LABEL[f]}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
