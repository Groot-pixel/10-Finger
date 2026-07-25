import { useStore } from '../store/useStore'
import { generateSpeedTestText } from '../engine/textGenerator'
import { CURRICULUM } from '../data/curriculum'
import Mascot from '../components/Mascot'

const ALL_KEYS = Array.from(new Set(CURRICULUM.flatMap((u) => u.keys)))

export default function PlacementTestPage() {
  const startPlacement = useStore((s) => s.startPlacement)
  const setView = useStore((s) => s.setView)

  const begin = () => {
    const { text } = generateSpeedTestText(ALL_KEYS, 180)
    startPlacement(text)
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-4 py-12 text-center">
      <Mascot mood="excited" size={110} bounce />
      <h1 className="text-2xl font-extrabold">Einstufungstest</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Tippe 60 Sekunden lang so schnell und genau du kannst. Basierend auf deinem Ergebnis
        schlagen wir dir eine passende Startposition im Lernpfad vor – du kannst danach jederzeit
        frühere Lektionen nachholen.
      </p>
      <div className="flex gap-3">
        <button onClick={begin} className="btn-press rounded-2xl px-6 py-3 font-bold text-white shadow" style={{ background: 'var(--primary)' }}>
          Test starten
        </button>
        <button onClick={() => setView('path')} className="btn-press rounded-2xl border px-6 py-3 font-bold" style={{ borderColor: 'var(--border)' }}>
          Abbrechen
        </button>
      </div>
    </div>
  )
}
