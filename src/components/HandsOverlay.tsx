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

const SKIN = 'var(--kb-key-fg)'
/** how far each fingertip pokes above its key, base(pinky)->tip(index), for a natural varied silhouette */
const FINGER_EXTENSION = [5, 17, 23, 14]
const BASE_HALF_WIDTH = 7.6
const TIP_RADIUS = 5.6

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

/**
 * one continuous outline for four fingers + the back of the hand, built from the
 * four home-key positions (already given left-to-right in screen space). A
 * finger currently reaching elsewhere (see `retracted`) is drawn tucked down,
 * so it doesn't visually double up with the bright detached finger on top.
 */
function handOutline(anchors: Point[], wristY: number, retracted: boolean[]): string {
  const tips = anchors.map((p, i) => ({ x: p.x, y: p.y - (retracted[i] ? 1 : FINGER_EXTENSION[i]) }))
  const hw = BASE_HALF_WIDTH
  const r = TIP_RADIUS
  const wristLeftX = anchors[0].x - 20
  const wristRightX = anchors[3].x + 16

  let d = `M ${wristLeftX} ${wristY}`
  d += ` Q ${anchors[0].x - hw - 6} ${anchors[0].y + 6} ${tips[0].x - hw} ${tips[0].y + 8}`
  d += ` L ${tips[0].x - hw} ${tips[0].y}`
  d += ` A ${r} ${r} 0 0 1 ${tips[0].x + hw} ${tips[0].y}`

  for (let i = 0; i < 3; i++) {
    const valleyY = Math.max(tips[i].y, tips[i + 1].y) + 13
    const vx = (anchors[i].x + anchors[i + 1].x) / 2
    d += ` Q ${tips[i].x + hw + 3} ${valleyY - 5} ${vx} ${valleyY}`
    d += ` Q ${tips[i + 1].x - hw - 3} ${valleyY - 5} ${tips[i + 1].x - hw} ${tips[i + 1].y + 8}`
    d += ` L ${tips[i + 1].x - hw} ${tips[i + 1].y}`
    d += ` A ${r} ${r} 0 0 1 ${tips[i + 1].x + hw} ${tips[i + 1].y}`
  }

  d += ` Q ${anchors[3].x + hw + 6} ${anchors[3].y + 6} ${wristRightX} ${wristY}`
  d += ` Q ${(wristLeftX + wristRightX) / 2} ${wristY + 20} ${wristLeftX} ${wristY}`
  d += ' Z'
  return d
}

/** short creases between fingers near the tips, like the reference photo's finger separations */
function fingerCreases(anchors: Point[], retracted: boolean[]): string {
  const tips = anchors.map((p, i) => ({ x: p.x, y: p.y - (retracted[i] ? 1 : FINGER_EXTENSION[i]) }))
  let d = ''
  for (let i = 0; i < 3; i++) {
    const valleyY = Math.max(tips[i].y, tips[i + 1].y) + 13
    const vx = (anchors[i].x + anchors[i + 1].x) / 2
    d += `M ${vx} ${valleyY - 3} L ${vx} ${valleyY + 9} `
  }
  return d
}

function Hand({
  anchors, wristY, thumbBase, thumbTip, retracted = [false, false, false, false],
}: {
  anchors: Point[]; wristY: number; thumbBase: Point; thumbTip: Point; retracted?: boolean[]
}) {
  return (
    <g>
      <path d={taperedCapsulePath(thumbBase.x, thumbBase.y, thumbTip.x, thumbTip.y, 9.5, 7.2)} fill={SKIN} fillOpacity={0.07} stroke={SKIN} strokeOpacity={0.32} strokeWidth={1.3} />
      <path d={handOutline(anchors, wristY, retracted)} fill={SKIN} fillOpacity={0.07} stroke={SKIN} strokeOpacity={0.38} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={fingerCreases(anchors, retracted)} stroke={SKIN} strokeOpacity={0.3} strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </g>
  )
}

function ActiveFinger({ home, target, color, glowId }: { home: Point; target: Point; color: string; glowId: string }) {
  const tip = useAnimatedPoint(target) ?? home
  return (
    <g>
      <defs>
        {/* soft light glowing up through the translucent fingertip, as if lit by the key underneath */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="55%" stopColor={color} stopOpacity="0.13" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {/* under-glow bleeding out from beneath the fingertip onto the keys around it */}
      <circle cx={tip.x} cy={tip.y} r={20} fill={color} opacity={0.18} style={{ mixBlendMode: 'screen' }} />
      <path
        d={taperedCapsulePath(home.x, home.y, tip.x, tip.y, 8, 6.4)}
        fill={`url(#${glowId})`}
        stroke={SKIN}
        strokeOpacity={0.45}
        strokeWidth={1.3}
      />
      <circle cx={tip.x} cy={tip.y} r={2.8} fill={color} opacity={0.6} />
    </g>
  )
}

export default function HandsOverlay({ keyRects, nextChar }: Props) {
  const uid = useId()
  if (keyRects.size === 0) return null

  const space = keyRects.get(' ')
  const a = keyRects.get('a')
  const s = keyRects.get('s')
  const d = keyRects.get('d')
  const f = keyRects.get('f')
  const j = keyRects.get('j')
  const k = keyRects.get('k')
  const l = keyRects.get('l')
  const oe = keyRects.get('ö')
  if (!space || !a || !s || !d || !f || !j || !k || !l || !oe) return null

  const leftAnchors = [a, s, d, f]
  const rightAnchors = [j, k, l, oe]
  const wristY = Math.max(a.y, j.y) + 78

  const activeLetterFinger = nextChar ? fingerFor(nextChar) : null
  const needsShift = nextChar ? isShifted(nextChar) : false
  const letterTarget = nextChar && nextChar !== ' ' ? keyRects.get(nextChar.toLowerCase()) : nextChar === ' ' ? space : undefined
  const shiftTarget = needsShift ? keyRects.get('shift') : undefined
  // simplification: the opposite-hand pinky always covers our single visible shift key
  const shiftFinger: FingerId = 'R-pinky'

  const activeFingers: { finger: FingerId; target: Point }[] = []
  if (activeLetterFinger && letterTarget) activeFingers.push({ finger: activeLetterFinger, target: letterTarget })
  if (shiftTarget) activeFingers.push({ finger: shiftFinger, target: shiftTarget })
  const activeSet = new Set(activeFingers.map((f) => f.finger))

  const leftRetracted = ['L-pinky', 'L-ring', 'L-middle', 'L-index'].map((f) => activeSet.has(f as FingerId))
  const rightRetracted = ['R-index', 'R-middle', 'R-ring', 'R-pinky'].map((f) => activeSet.has(f as FingerId))

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width="100%"
      height="100%"
      style={{ zIndex: 20 }}
      aria-hidden="true"
    >
      <Hand anchors={leftAnchors} wristY={wristY} thumbBase={{ x: f.x + 13, y: f.y + 32 }} thumbTip={{ x: f.x + 36, y: wristY - 8 }} retracted={leftRetracted} />
      <Hand anchors={rightAnchors} wristY={wristY} thumbBase={{ x: j.x - 13, y: j.y + 32 }} thumbTip={{ x: j.x - 36, y: wristY - 8 }} retracted={rightRetracted} />

      {activeFingers.map(({ finger, target }) => {
        const home = keyRects.get(HOME_KEY[finger])
        if (!home) return null
        const isThumb = finger.endsWith('thumb')
        const base: Point = isThumb ? { x: home.x, y: wristY - 40 } : { x: home.x, y: home.y }
        return (
          <ActiveFinger key={finger} home={base} target={target} color={FINGER_COLOR[finger]} glowId={`${uid}-glow-${finger}`} />
        )
      })}
    </svg>
  )
}
