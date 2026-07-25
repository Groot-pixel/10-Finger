import { FINGER_COLOR, type FingerId } from '../data/keyboard'

const ORDER: FingerId[] = ['L-pinky', 'L-ring', 'L-middle', 'L-index', 'L-thumb', 'R-thumb', 'R-index', 'R-middle', 'R-ring', 'R-pinky']
const HEIGHTS: Record<FingerId, number> = {
  'L-pinky': 22, 'L-ring': 30, 'L-middle': 34, 'L-index': 28, 'L-thumb': 14,
  'R-thumb': 14, 'R-index': 28, 'R-middle': 34, 'R-ring': 30, 'R-pinky': 22,
}

export default function FingerGuide({ active }: { active: FingerId | null }) {
  return (
    <div className="flex items-end justify-center gap-1.5 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--kb-border)', background: 'var(--kb-panel-bg)' }}>
      {ORDER.map((f) => {
        const isActive = f === active
        const isThumb = f.endsWith('thumb')
        return (
          <div key={f} className="flex flex-col items-center gap-1">
            <div
              className="rounded-full transition-all duration-150"
              style={{
                width: isThumb ? 16 : 13,
                height: HEIGHTS[f] + (isActive ? 6 : 0),
                background: isActive ? FINGER_COLOR[f] : 'var(--kb-key-bg)',
                border: `2px solid ${isActive ? FINGER_COLOR[f] : 'var(--kb-border)'}`,
                boxShadow: isActive ? `0 0 10px ${FINGER_COLOR[f]}aa` : 'none',
                transform: isActive ? 'translateY(-4px)' : 'none',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
