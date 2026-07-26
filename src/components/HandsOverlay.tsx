import { FINGER_COLOR, fingerFor, isShifted, type FingerId } from '../data/keyboard'
import { useAnimatedPoint } from '../hooks/useAnimatedPoint'
import type { Point } from '../hooks/useKeyRects'

interface Props {
  keyRects: Map<string, Point>
  nextChar: string | null
}

/** touch-typing home-row anchor for each finger (thumbs rest near the space bar) */
const HOME_KEY: Record<FingerId, string> = {
  'L-pinky': 'a', 'L-ring': 's', 'L-middle': 'd', 'L-index': 'f', 'L-thumb': ' ',
  'R-thumb': ' ', 'R-index': 'j', 'R-middle': 'k', 'R-ring': 'l', 'R-pinky': 'ö',
}

const LEFT_FINGERS: FingerId[] = ['L-pinky', 'L-ring', 'L-middle', 'L-index']
const RIGHT_FINGERS: FingerId[] = ['R-index', 'R-middle', 'R-ring', 'R-pinky']

function ActiveFinger({ home, target, color }: { home: Point; target: Point; color: string }) {
  const tip = useAnimatedPoint(target) ?? home
  return (
    <g style={{ transition: 'opacity 120ms ease' }}>
      <line x1={home.x} y1={home.y} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={11} strokeLinecap="round" opacity={0.55} />
      <circle cx={tip.x} cy={tip.y} r={9} fill={color} stroke="#00000022" strokeWidth={1} />
      <circle cx={tip.x} cy={tip.y} r={3.2} fill="#ffffff" opacity={0.6} />
    </g>
  )
}

function Palm({ fingers, keyRects, palmY }: { fingers: FingerId[]; keyRects: Map<string, Point>; palmY: number }) {
  const points = fingers.map((f) => keyRects.get(HOME_KEY[f])).filter((p): p is Point => !!p)
  if (points.length < 4) return null
  const p0 = points[0]
  const p3 = points[3]
  const bulge = palmY + 26
  const d = `M ${p0.x - 10} ${palmY} L ${p0.x - 6} ${palmY - 4} Q ${(p0.x + p3.x) / 2} ${bulge + 14} ${p3.x + 6} ${palmY - 4} L ${p3.x + 10} ${palmY} Q ${(p0.x + p3.x) / 2} ${bulge} ${p0.x - 10} ${palmY} Z`
  return <path d={d} fill="var(--kb-key-fg)" opacity={0.08} />
}

export default function HandsOverlay({ keyRects, nextChar }: Props) {
  if (keyRects.size === 0) return null

  const space = keyRects.get(' ')
  if (!space) return null
  const palmY = space.y + 30

  const activeLetterFinger = nextChar ? fingerFor(nextChar) : null
  const needsShift = nextChar ? isShifted(nextChar) : false
  const letterTarget = nextChar && nextChar !== ' ' ? keyRects.get(nextChar.toLowerCase()) : nextChar === ' ' ? space : undefined
  const shiftTarget = needsShift ? keyRects.get('shift') : undefined
  // simplification: the opposite-hand pinky always covers our single visible shift key
  const shiftFinger: FingerId = 'R-pinky'

  const allFingers: FingerId[] = [...LEFT_FINGERS, ...RIGHT_FINGERS, 'L-thumb', 'R-thumb']

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width="100%"
      height="100%"
      style={{ zIndex: 20 }}
      aria-hidden="true"
    >
      <Palm fingers={LEFT_FINGERS} keyRects={keyRects} palmY={palmY} />
      <Palm fingers={RIGHT_FINGERS} keyRects={keyRects} palmY={palmY} />

      {allFingers.map((finger) => {
        const home = keyRects.get(HOME_KEY[finger])
        if (!home) return null
        const base: Point = finger.endsWith('thumb') ? { x: home.x, y: palmY - 4 } : { x: home.x, y: palmY }

        const isLetterFinger = finger === activeLetterFinger && !!letterTarget
        const isShiftFinger = finger === shiftFinger && !!shiftTarget
        if (isLetterFinger || isShiftFinger) {
          const target = (isLetterFinger ? letterTarget : shiftTarget) as Point
          return <ActiveFinger key={finger} home={base} target={target} color={FINGER_COLOR[finger]} />
        }

        return (
          <g key={finger} opacity={0.22}>
            <line x1={base.x} y1={base.y} x2={home.x} y2={home.y} stroke="var(--kb-key-fg)" strokeWidth={9} strokeLinecap="round" />
            <circle cx={home.x} cy={home.y} r={6.5} fill="var(--kb-key-fg)" />
          </g>
        )
      })}
    </svg>
  )
}
