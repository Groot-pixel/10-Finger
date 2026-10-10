import { useStore, unlockedKeysForPlayer, weakestKeys } from '../store/useStore'
import { generateWeakKeyPractice, generateSpeedTestText } from '../engine/textGenerator'
import { generateLessonText } from '../engine/textGenerator'
import { ALL_LESSON_IDS } from '../data/curriculum'
import { ABC_TEXT } from '../data/keyboard'
import Mascot from '../components/Mascot'
import Icon from '../components/Icon'
import KeyHeatmap from '../components/KeyHeatmap'
import { BannerPattern } from '../components/Art'

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
      <div className="relative mb-6 overflow-hidden rounded-3xl px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #35c7b5, #22a99c)', boxShadow: '0 5px 0 #177f78' }}>
        <BannerPattern />
        <div className="relative flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">Training</div>
            <h1 className="text-2xl font-black">Übungsstube</h1>
            <p className="text-sm font-semibold opacity-90">Kostenloses Training – ganz ohne Druck, ganz ohne Grenzen.</p>
          </div>
          <Mascot mood="excited" size={84} />
        </div>
      </div>

      <button onClick={practiceWeak} className="tile tile-hover mb-4 flex w-full items-center gap-4 p-4 text-left">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl" style={{ background: '#ff4b4b1f' }}>
          <Icon name="target" size={42} />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-extrabold">Schwache Tasten trainieren</span>
          <span className="block text-sm" style={{ color: 'var(--text-muted)' }}>
            {weak.length ? 'Ein Übungstext, der genau deine Problem-Tasten trifft:' : 'Noch keine Daten – tippe ein paar Lektionen!'}
          </span>
          {weak.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {weak.map((k) => (
                <span key={k} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white" style={{ background: '#ff4b4b', boxShadow: '0 3px 0 #d93636' }}>
                  {k.toUpperCase()}
                </span>
              ))}
            </span>
          )}
        </span>
        <Icon name="chevron" size={20} className="opacity-40" />
      </button>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card icon="repeat" title="Zufällige Wiederholung" desc="Wiederhole eine bereits gelernte Lektion." onClick={practiceRandomReview} color="#eda958" />
        <Card icon="stopwatch" title="Geschwindigkeitstest" desc="Wie viele Wörter pro Minute schaffst du?" onClick={speedTest} color="#ff4b4b" />
        <Card icon="abc" title="ABC-Durchlauf" desc="Das ganze Alphabet einmal durch – a bis ß, dann Großbuchstaben." onClick={() => startPractice(ABC_TEXT)} color="#6366f1" />
        <Card icon="keyboard" title="Freies Tippen" desc="Ein zufälliger Übungstext mit deinem aktuellen Wortschatz." onClick={practiceRandomReview} color="#2fb9a8" />
      </div>

      <h2 className="mb-1 mt-9 flex items-center gap-2 text-lg font-extrabold">
        <Icon name="chart" size={24} /> Deine Fehler-Heatmap
      </h2>
      <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        {Object.keys(keyStats).length === 0 ? 'Tippe ein paar Lektionen – dann siehst du hier, welche Tasten dir schwerfallen.' : 'Je röter eine Taste, desto öfter hast du dich dort vertippt.'}
      </p>
      <KeyHeatmap keyStats={keyStats} />
    </div>
  )
}

function Card({ icon, title, desc, onClick, color }: { icon: string; title: string; desc: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} className="tile tile-hover relative flex flex-col items-start gap-2 overflow-hidden p-4 text-left">
      <span className="pointer-events-none absolute -bottom-7 -right-7 opacity-[0.08]">
        <Icon name={icon} size={96} />
      </span>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `${color}1f` }}>
        <Icon name={icon} size={36} />
      </span>
      <span className="text-[17px] font-extrabold">{title}</span>
      <span className="relative text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</span>
    </button>
  )
}
