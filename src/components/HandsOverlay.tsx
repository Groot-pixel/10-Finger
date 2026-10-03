import { useEffect, useId, useRef, useState } from 'react'
import { FINGER_COLOR, fingerFor, isShifted, type FingerId } from '../data/keyboard'
import type { Point } from '../hooks/useKeyRects'

interface Props {
  keyRects: Map<string, Point>
  nextChar: string | null
}

const SKIN = 'var(--kb-key-fg)'
const LINE = 1.5

type Hand = 'L' | 'R'
type Digit = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb'

const DIGITS: Exclude<Digit, 'thumb'>[] = ['pinky', 'ring', 'middle', 'index']
const HOME_KEY: Record<Hand, Record<Exclude<Digit, 'thumb'>, string>> = {
  L: { pinky: 'a', ring: 's', middle: 'd', index: 'f' },
  R: { pinky: 'ö', ring: 'l', middle: 'k', index: 'j' },
}
/** finger thickness relative to one key width */
const WIDTH: Record<Digit, number> = { pinky: 0.46, ring: 0.52, middle: 0.55, index: 0.53, thumb: 0.56 }
/** how far each knuckle sits from its key column, toward the middle of the palm */
const KNUCKLE_SHIFT: Record<Exclude<Digit, 'thumb'>, number> = { pinky: 0.2, ring: 0.07, middle: -0.02, index: -0.1 }

/** one primitive of the hand: either a filled shape or a thick rounded stroke (fingers, thumb, wrist) */
type Part =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot: number }
  | { kind: 'limb'; d: string; w: number }

function limb(from: Point, to: Point, bend: number, w: number): Part {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  // control point pushed sideways for a gentle natural curl
  const cx = mx + (-dy / len) * bend
  const cy = my + (dx / len) * bend
  return { kind: 'limb', d: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`, w }
}

function renderParts(parts: Part[], mode: 'outer' | 'inner' | 'fill', color: string) {
  return parts.map((p, i) => {
    const extra = mode === 'outer' ? LINE * 2 : 0
    if (p.kind === 'ellipse') {
      return (
        <ellipse
          key={i}
          cx={p.cx}
          cy={p.cy}
          rx={p.rx}
          ry={p.ry}
          transform={`rotate(${p.rot} ${p.cx} ${p.cy})`}
          fill={color}
          stroke={color}
          strokeWidth={extra}
        />
      )
    }
    return <path key={i} d={p.d} fill="none" stroke={color} strokeWidth={p.w + extra} strokeLinecap="round" />
  })
}

/** remembers the tip of a moving finger and eases it to its target; restarts from home when another finger takes over */
function useFingerTip(id: string | null, home: Point | null, target: Point | null): Point | null {
  const [pos, setPos] = useState<Point | null>(target)
  const lastId = useRef<string | null>(null)
  const current = useRef<Point | null>(null)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!target || !home) {
      lastId.current = id
      current.current = null
      setPos(null)
      return
    }
    const from = lastId.current === id && current.current ? current.current : home
    lastId.current = id
    const start = performance.now()
    const dur = 140
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const e = 1 - Math.pow(1 - t, 3)
      const p = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e }
      current.current = p
      setPos(p)
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, home?.x, home?.y, target?.x, target?.y])

  return pos
}

function splitFinger(f: FingerId): { hand: Hand; digit: Digit } {
  const [h, d] = f.split('-') as [Hand, Digit]
  return { hand: h, digit: d }
}

interface HandGeometry {
  parts: Part[]
  creases: string
  tips: Record<Digit, Point>
  knuckles: Record<Digit, Point>
}

function buildHand(
  hand: Hand,
  keyRects: Map<string, Point>,
  u: number,
  homeY: number,
  space: Point,
  overrides: Partial<Record<Digit, Point>>,
): HandGeometry | null {
  const side = hand === 'L' ? 1 : -1 // +1 = toward the keyboard's center for the left hand
  const knuckles = {} as Record<Digit, Point>
  const tips = {} as Record<Digit, Point>
  const parts: Part[] = []
  let creases = ''

  for (const digit of DIGITS) {
    const key = keyRects.get(HOME_KEY[hand][digit])
    if (!key) return null
    knuckles[digit] = { x: key.x + side * KNUCKLE_SHIFT[digit] * u, y: homeY + 1.15 * u }
    tips[digit] = { x: key.x, y: key.y + 0.08 * u }
  }

  const palmX = (knuckles.pinky.x + knuckles.index.x) / 2 + side * 0.1 * u
  const palmY = homeY + 1.95 * u
  // wrist reaches below the keyboard and fades out
  parts.push(limb({ x: palmX, y: palmY }, { x: palmX - side * 0.35 * u, y: homeY + 4.4 * u }, 0, 2.5 * u))
  parts.push({ kind: 'ellipse', cx: palmX, cy: palmY, rx: 1.55 * u, ry: 1.2 * u, rot: side * 8 })

  // thumb lies on the space bar, pointing toward the center
  knuckles.thumb = { x: palmX + side * 1.05 * u, y: homeY + 2.5 * u }
  tips.thumb = { x: knuckles.index.x + side * 1.2 * u, y: space.y + 0.02 * u }

  for (const digit of [...DIGITS, 'thumb'] as Digit[]) {
    const tip = overrides[digit] ?? tips[digit]
    // reaching down (bottom row) pulls the knuckle down with it so the finger never folds backwards
    const base = digit === 'thumb' ? knuckles[digit] : { x: knuckles[digit].x + (tip.x - knuckles[digit].x) * 0.3, y: Math.max(knuckles[digit].y, tip.y + 0.6 * u) }
    knuckles[digit] = base
    const w = WIDTH[digit] * u
    const bend = digit === 'thumb' ? side * 0.25 * u : -side * 0.06 * u
    parts.push(limb(base, tip, bend, w))

    // a faint knuckle crease about 40% down from the fingertip
    const dx = base.x - tip.x
    const dy = base.y - tip.y
    const len = Math.hypot(dx, dy) || 1
    if (len > 0.6 * u) {
      const cx = tip.x + (dx / len) * len * 0.4
      const cy = tip.y + (dy / len) * len * 0.4
      const px = (-dy / len) * w * 0.28
      const py = (dx / len) * w * 0.28
      creases += `M ${cx - px} ${cy - py} L ${cx + px} ${cy + py} `
    }
    tips[digit] = tip
  }

  return { parts, creases, tips, knuckles }
}

export default function HandsOverlay({ keyRects, nextChar }: Props) {
  const uid = useId().replace(/:/g, '')

  const a = keyRects.get('a')
  const s = keyRects.get('s')
  const space = keyRects.get(' ')
  const ready = !!(a && s && space)
  const u = ready ? Math.abs(s!.x - a!.x) : 0
  const homeY = ready ? a!.y : 0

  // which finger(s) leave their resting place for the next character
  const letterFinger = nextChar ? fingerFor(nextChar) : null
  const letterTarget = !nextChar ? null : nextChar === ' ' ? space ?? null : keyRects.get(nextChar.toLowerCase()) ?? null
  const shiftTarget = nextChar && isShifted(nextChar) ? keyRects.get('shift') ?? null : null
  const shiftFinger: FingerId = 'R-pinky'

  const letterHome = (() => {
    if (!letterFinger || !ready) return null
    const { hand, digit } = splitFinger(letterFinger)
    if (digit === 'thumb') return space ?? null
    const k = keyRects.get(HOME_KEY[hand][digit])
    return k ? { x: k.x, y: k.y + 0.08 * u } : null
  })()
  const shiftHome = (() => {
    const k = keyRects.get('ö')
    return k ? { x: k.x, y: k.y + 0.08 * u } : null
  })()

  const letterTip = useFingerTip(letterFinger, letterHome, letterTarget ? { x: letterTarget.x, y: letterTarget.y + 0.05 * u } : null)
  const shiftTip = useFingerTip(shiftTarget ? 'shift' : null, shiftHome, shiftTarget)

  if (!ready || u < 4) return null

  const overrides: Record<Hand, Partial<Record<Digit, Point>>> = { L: {}, R: {} }
  const active: { hand: Hand; digit: Digit; color: string; tip: Point }[] = []
  if (letterFinger && letterTip) {
    const { hand, digit } = splitFinger(letterFinger)
    if (digit !== 'thumb') overrides[hand][digit] = letterTip
    active.push({ hand, digit, color: FINGER_COLOR[letterFinger], tip: letterTip })
  }
  if (shiftTip && letterFinger !== shiftFinger) {
    overrides.R.pinky = shiftTip
    active.push({ hand: 'R', digit: 'pinky', color: FINGER_COLOR[shiftFinger], tip: shiftTip })
  }

  const left = buildHand('L', keyRects, u, homeY, space!, overrides.L)
  const right = buildHand('R', keyRects, u, homeY, space!, overrides.R)
  if (!left || !right) return null

  const parts = [...left.parts, ...right.parts]
  const creases = left.creases + right.creases
  const fadeStart = space!.y + 0.25 * u
  const fadeEnd = space!.y + 1.25 * u

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width="100%"
      height="100%"
      style={{ zIndex: 20 }}
      aria-hidden="true"
    >
      <defs>
        {/* outline = slightly grown silhouette minus the silhouette itself → one clean contour around the whole hand */}
        <mask id={`${uid}-outline`} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
          {renderParts(parts, 'outer', 'white')}
          {renderParts(parts, 'inner', 'black')}
        </mask>
        <linearGradient id={`${uid}-fadegrad`} gradientUnits="userSpaceOnUse" x1={0} y1={fadeStart} x2={0} y2={fadeEnd}>
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id={`${uid}-fade`} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
          <rect x={-2000} y={-2000} width={6000} height={6000} fill={`url(#${uid}-fadegrad)`} />
        </mask>
        {active.map((f, i) => {
          const g = f.hand === 'L' ? left : right
          const base = g.knuckles[f.digit]
          return (
            <linearGradient key={i} id={`${uid}-glow${i}`} gradientUnits="userSpaceOnUse" x1={f.tip.x} y1={f.tip.y} x2={base.x} y2={base.y}>
              <stop offset="0" stopColor={f.color} stopOpacity="0.55" />
              <stop offset="0.45" stopColor={f.color} stopOpacity="0.18" />
              <stop offset="1" stopColor={f.color} stopOpacity="0" />
            </linearGradient>
          )
        })}
      </defs>

      {/* light from the key spilling out around the fingertip */}
      {active.map((f, i) => (
        <circle key={`halo${i}`} cx={f.tip.x} cy={f.tip.y} r={0.7 * u} fill={f.color} opacity={0.22} />
      ))}

      <g mask={`url(#${uid}-fade)`}>
        {/* translucent skin – drawn as one group so overlapping parts don't stack up darker */}
        <g opacity={0.07}>{renderParts(parts, 'inner', SKIN)}</g>

        {/* the key shining up through the active finger */}
        {active.map((f, i) => {
          const g = f.hand === 'L' ? left : right
          const d = limb(g.knuckles[f.digit], f.tip, f.digit === 'thumb' ? (f.hand === 'L' ? 1 : -1) * 0.25 * u : (f.hand === 'L' ? -1 : 1) * 0.06 * u, WIDTH[f.digit] * u)
          return d.kind === 'limb' ? (
            <path key={`glow${i}`} d={d.d} fill="none" stroke={`url(#${uid}-glow${i})`} strokeWidth={d.w} strokeLinecap="round" />
          ) : null
        })}

        <rect x={-2000} y={-2000} width={6000} height={6000} fill={SKIN} opacity={0.5} mask={`url(#${uid}-outline)`} />
        <path d={creases} stroke={SKIN} strokeOpacity={0.28} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}
