import { useId } from 'react'
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

const SKIN = 'var(--kb-key-fg)'

/** a rounded "finger" shape (wider at the base, tapering to the fingertip) between two arbitrary points */
function taperedCapsulePath(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const a1 = { x: x1 + px * r1, y: y1 + py * r1 }
  const b1 = { x: x1 - px * r1, y: y1 - py * r1 }
  const a2 = { x: x2 + px * r2, y: y2 + py * r2 }
  const b2 = { x: x2 - px * r2, y: y2 - py * r2 }
  return `M ${a1.x} ${a1.y} L ${a2.x} ${a2.y} A ${r2} ${r2} 0 0 1 ${b2.x} ${b2.y} L ${b1.x} ${b1.y} A ${r1} ${r1} 0 0 1 ${a1.x} ${a1.y} Z`
}

function Finger({ base, tip, r1, r2, glowId }: { base: Point; tip: Point; r1: number; r2: number; glowId?: string }) {
  return (
    <path
      d={taperedCapsulePath(base.x, base.y, tip.x, tip.y, r1, r2)}
      fill={glowId ? `url(#${glowId})` : SKIN}
      fillOpacity={glowId ? 1 : 0.08}
      stroke={SKIN}
      strokeOpacity={0.4}
      strokeWidth={1.3}
    />
  )
}

function ActiveFinger({ home, target, color, glowId }: { home: Point; target: Point; color: string; glowId: string }) {
  const tip = useAnimatedPoint(target) ?? home
  return (
    <g>
      <defs>
        {/* soft light glowing up through the translucent fingertip, as if lit by the key underneath */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="55%" stopColor={color} stopOpacity="0.11" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </radialGradient>
      </defs>
      {/* under-glow bleeding out from beneath the fingertip onto the keys around it */}
      <circle cx={tip.x} cy={tip.y} r={20} fill={color} opacity={0.16} style={{ mixBlendMode: 'screen' }} />
      <Finger base={home} tip={tip} r1={8} r2={6.5} glowId={glowId} />
      <circle cx={tip.x} cy={tip.y} r={3} fill={color} opacity={0.55} />
    </g>
  )
}

function Palm({ fingers, keyRects, palmY }: { fingers: FingerId[]; keyRects: Map<string, Point>; palmY: number }) {
  const points = fingers.map((f) => keyRects.get(HOME_KEY[f])).filter((p): p is Point => !!p)
  if (points.length < 4) return null
  const p0 = points[0]
  const p3 = points[3]
  const bulge = palmY + 34
  const d = `M ${p0.x - 14} ${palmY - 6} Q ${p0.x - 16} ${palmY + 6} ${p0.x - 8} ${bulge - 2} Q ${(p0.x + p3.x) / 2} ${bulge + 12} ${p3.x + 8} ${bulge - 2} Q ${p3.x + 16} ${palmY + 6} ${p3.x + 14} ${palmY - 6} Z`
  return <path d={d} fill={SKIN} fillOpacity={0.06} stroke={SKIN} strokeOpacity={0.3} strokeWidth={1.3} />
}

export default function HandsOverlay({ keyRects, nextChar }: Props) {
  const uid = useId()
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
        const isThumb = finger.endsWith('thumb')
        const base: Point = isThumb ? { x: home.x, y: palmY - 4 } : { x: home.x, y: palmY }

        const isLetterFinger = finger === activeLetterFinger && !!letterTarget
        const isShiftFinger = finger === shiftFinger && !!shiftTarget
        if (isLetterFinger || isShiftFinger) {
          const target = (isLetterFinger ? letterTarget : shiftTarget) as Point
          return (
            <ActiveFinger
              key={finger}
              home={base}
              target={target}
              color={FINGER_COLOR[finger]}
              glowId={`${uid}-glow-${finger}`}
            />
          )
        }

        return <Finger key={finger} base={base} tip={home} r1={isThumb ? 7 : 7.5} r2={isThumb ? 6 : 6} />
      })}
    </svg>
  )
}
