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
type Finger = Exclude<Digit, 'thumb'>

const FINGERS: Finger[] = ['pinky', 'ring', 'middle', 'index']
const HOME_KEY: Record<Hand, Record<Finger, string>> = {
  L: { pinky: 'a', ring: 's', middle: 'd', index: 'f' },
  R: { pinky: 'ö', ring: 'l', middle: 'k', index: 'j' },
}

/*
 * Proportions taken from photos of a real hand resting on a keyboard (all in key widths):
 * fingers are almost a key wide and lie nearly parallel, the knuckles sit roughly at
 * space-bar height, the pinky starts lower, and the thumb leaves the palm low on its
 * inner side and points diagonally up onto the space bar.
 */
const WIDTH: Record<Digit, number> = { pinky: 0.6, ring: 0.7, middle: 0.74, index: 0.72, thumb: 0.68 }
const KNUCKLE_SHIFT: Record<Finger, number> = { pinky: 0.14, ring: 0.05, middle: 0, index: -0.05 }
const KNUCKLE_DROP: Record<Finger, number> = { pinky: 0.32, ring: 0.06, middle: 0, index: 0.05 }
const KNUCKLE_Y = 1.75
/** a fingertip never sits further than this above its knuckle – beyond that the whole hand slides up */
const MAX_REACH = 2.35

type Part = { kind: 'shape'; d: string } | { kind: 'limb'; d: string; w: number }

function limbPath(from: Point, to: Point, bend: number): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const cx = (from.x + to.x) / 2 + (-dy / len) * bend
  const cy = (from.y + to.y) / 2 + (dx / len) * bend
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
}

/** smooth closed outline through the midpoints of a polygon, using its corners as curve handles */
function roundedShape(pts: Point[]): string {
  const mid = (p: Point, q: Point) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 })
  const n = pts.length
  const start = mid(pts[n - 1], pts[0])
  let d = `M ${start.x} ${start.y}`
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n])
    d += ` Q ${pts[i].x} ${pts[i].y} ${m.x} ${m.y}`
  }
  return d + ' Z'
}

function renderParts(parts: Part[], mode: 'outer' | 'inner', color: string) {
  const extra = mode === 'outer' ? LINE * 2 : 0
  return parts.map((p, i) =>
    p.kind === 'shape' ? (
      <path key={i} d={p.d} fill={color} stroke={color} strokeWidth={extra} strokeLinejoin="round" />
    ) : (
      <path key={i} d={p.d} fill="none" stroke={color} strokeWidth={p.w + extra} strokeLinecap="round" />
    ),
  )
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
    const dur = 150
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
  /** exact path of every digit, so the glow can follow an active finger precisely */
  limbs: Record<Digit, { d: string; w: number; base: Point; tip: Point }>
}

function buildHand(
  hand: Hand,
  keyRects: Map<string, Point>,
  u: number,
  homeY: number,
  space: Point,
  overrides: Partial<Record<Digit, Point>>,
): HandGeometry | null {
  const side = hand === 'L' ? 1 : -1 // +1 points toward the keyboard's center (the thumb side)
  const rest = {} as Record<Finger, Point>
  const knuckle0 = {} as Record<Finger, Point>

  for (const f of FINGERS) {
    const key = keyRects.get(HOME_KEY[hand][f])
    if (!key) return null
    rest[f] = { x: key.x, y: key.y + 0.1 * u }
    knuckle0[f] = { x: key.x + side * KNUCKLE_SHIFT[f] * u, y: homeY + (KNUCKLE_Y + KNUCKLE_DROP[f]) * u }
  }

  // reaching far up (number row) moves the whole hand up instead of over-stretching one finger
  let lift = 0
  for (const f of FINGERS) {
    const t = overrides[f]
    if (t) lift = Math.min(lift, t.y + MAX_REACH * u - knuckle0[f].y)
  }
  const knuckle = {} as Record<Finger, Point>
  for (const f of FINGERS) knuckle[f] = { x: knuckle0[f].x, y: knuckle0[f].y + lift }

  const K = homeY + KNUCKLE_Y * u + lift
  const kP = knuckle.pinky
  const kI = knuckle.index
  const cx = (kP.x + kI.x) / 2 + side * 0.1 * u
  const at = (x: number, y: number): Point => ({ x, y })

  // back of the hand + wrist as one rounded trapezoid (wide at the knuckles, narrower at the wrist)
  const palm = roundedShape([
    at(kP.x - side * 0.25 * u, kP.y - 0.35 * u),
    at(knuckle.middle.x, knuckle.middle.y - 0.45 * u),
    at(kI.x + side * 0.3 * u, kI.y - 0.35 * u),
    at(kI.x + side * 0.42 * u, K + 0.3 * u),
    at(kI.x + side * 0.34 * u, K + 1.35 * u),
    at(cx + side * 0.8 * u, K + 2.4 * u),
    at(cx + side * 0.7 * u, K + 3.8 * u),
    at(cx - side * 0.8 * u, K + 3.8 * u),
    at(cx - side * 0.9 * u, K + 2.4 * u),
    at(kP.x - side * 0.6 * u, K + 1.2 * u),
  ])
  const parts: Part[] = [{ kind: 'shape', d: palm }]
  const limbs = {} as HandGeometry['limbs']
  let creases = ''

  // webbing between neighbouring fingers: a small disc whose top forms the rounded U of the skin fold
  for (let i = 0; i < FINGERS.length - 1; i++) {
    const p = knuckle[FINGERS[i]]
    const q = knuckle[FINGERS[i + 1]]
    const wx = (p.x + q.x) / 2
    const wy = Math.min(p.y, q.y) - 0.42 * u
    parts.push({ kind: 'limb', d: `M ${wx} ${wy + 0.3 * u} L ${wx} ${wy + 0.31 * u}`, w: 0.62 * u })
  }

  const thumbBase = at(kI.x + side * 0.12 * u, K + 1.95 * u)
  const thumbRest = at(kI.x + side * 1.05 * u, space.y + 0.05 * u + lift)

  for (const digit of [...FINGERS, 'thumb'] as Digit[]) {
    const isThumb = digit === 'thumb'
    let tip = overrides[digit] ?? (isThumb ? thumbRest : rest[digit as Finger])
    let base = isThumb ? thumbBase : knuckle[digit as Finger]
    // idle fingers keep touching their home key; if the hand slid up they simply curl shorter
    if (!isThumb && !overrides[digit] && tip.y > base.y - 0.45 * u) tip = at(tip.x, base.y - 0.45 * u)
    // a finger reaching down past its knuckle would fold backwards – drop the knuckle instead
    if (!isThumb && tip.y > base.y - 0.55 * u) base = at(base.x, tip.y + 0.55 * u)

    const w = WIDTH[digit] * u
    const bend = isThumb ? side * 0.18 * u : -side * 0.04 * u
    const d = limbPath(base, tip, bend)
    parts.push({ kind: 'limb', d, w })
    // fingers are a little wider toward the knuckle than at the tip
    const wide = { x: base.x + (tip.x - base.x) * 0.5, y: base.y + (tip.y - base.y) * 0.5 }
    parts.push({ kind: 'limb', d: `M ${base.x} ${base.y} L ${wide.x} ${wide.y}`, w: w * 1.12 })
    limbs[digit] = { d, w, base, tip }

    // two faint joint creases, like the wrinkles over real finger joints
    const dx = base.x - tip.x
    const dy = base.y - tip.y
    const len = Math.hypot(dx, dy) || 1
    if (len > 0.9 * u) {
      for (const t of isThumb ? [0.42] : [0.3, 0.6]) {
        const mx = tip.x + dx * t
        const my = tip.y + dy * t
        const px = (-dy / len) * w * 0.22
        const py = (dx / len) * w * 0.22
        creases += `M ${mx - px} ${my - py} Q ${mx} ${my + 0.06 * u} ${mx + px} ${my + py} `
      }
    }
  }

  return { parts, creases, limbs }
}

export default function HandsOverlay({ keyRects, nextChar }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

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

  const homeOf = (f: FingerId | null): Point | null => {
    if (!f || !ready) return null
    const { hand, digit } = splitFinger(f)
    if (digit === 'thumb') return space ? { x: space.x, y: space.y } : null
    const k = keyRects.get(HOME_KEY[hand][digit])
    return k ? { x: k.x, y: k.y + 0.1 * u } : null
  }

  const letterTip = useFingerTip(
    letterFinger,
    homeOf(letterFinger),
    letterTarget && letterFinger && !letterFinger.endsWith('thumb') ? { x: letterTarget.x, y: letterTarget.y + 0.08 * u } : null,
  )
  const shiftTip = useFingerTip(shiftTarget ? 'shift' : null, homeOf(shiftFinger), shiftTarget)

  if (!ready || u < 4) return null

  const overrides: Record<Hand, Partial<Record<Digit, Point>>> = { L: {}, R: {} }
  const active: { hand: Hand; digit: Digit; color: string }[] = []
  if (letterFinger) {
    const { hand, digit } = splitFinger(letterFinger)
    if (letterTip) overrides[hand][digit] = letterTip
    if (letterTip || digit === 'thumb') active.push({ hand, digit, color: FINGER_COLOR[letterFinger] })
  }
  if (shiftTip && letterFinger !== shiftFinger) {
    overrides.R.pinky = shiftTip
    active.push({ hand: 'R', digit: 'pinky', color: FINGER_COLOR[shiftFinger] })
  }

  const left = buildHand('L', keyRects, u, homeY, space!, overrides.L)
  const right = buildHand('R', keyRects, u, homeY, space!, overrides.R)
  if (!left || !right) return null

  const parts = [...left.parts, ...right.parts]
  const creases = left.creases + right.creases
  const fadeStart = homeY + 3.1 * u
  const fadeEnd = homeY + 4.9 * u
  const big = { x: -4000, y: -4000, width: 10000, height: 10000 }

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
        <mask id={`${uid}o`} maskUnits="userSpaceOnUse" {...big}>
          {renderParts(parts, 'outer', 'white')}
          {renderParts(parts, 'inner', 'black')}
        </mask>
        <linearGradient id={`${uid}fg`} gradientUnits="userSpaceOnUse" x1={0} y1={fadeStart} x2={0} y2={fadeEnd}>
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id={`${uid}f`} maskUnits="userSpaceOnUse" {...big}>
          <rect {...big} fill={`url(#${uid}fg)`} />
        </mask>
        {active.map((f, i) => {
          const l = (f.hand === 'L' ? left : right).limbs[f.digit]
          return (
            <linearGradient key={i} id={`${uid}g${i}`} gradientUnits="userSpaceOnUse" x1={l.tip.x} y1={l.tip.y} x2={l.base.x} y2={l.base.y}>
              <stop offset="0" stopColor={f.color} stopOpacity="0.55" />
              <stop offset="0.4" stopColor={f.color} stopOpacity="0.2" />
              <stop offset="1" stopColor={f.color} stopOpacity="0" />
            </linearGradient>
          )
        })}
      </defs>

      {/* light from the key spilling out around the fingertip */}
      {active.map((f, i) => {
        const l = (f.hand === 'L' ? left : right).limbs[f.digit]
        return <circle key={`h${i}`} cx={l.tip.x} cy={l.tip.y} r={0.75 * u} fill={f.color} opacity={0.2} />
      })}

      <g mask={`url(#${uid}f)`}>
        {/* translucent skin – one group so overlapping parts don't stack up darker */}
        <g opacity={0.08}>{renderParts(parts, 'inner', SKIN)}</g>

        {/* the key shining up through the active finger */}
        {active.map((f, i) => {
          const l = (f.hand === 'L' ? left : right).limbs[f.digit]
          return <path key={`g${i}`} d={l.d} fill="none" stroke={`url(#${uid}g${i})`} strokeWidth={l.w} strokeLinecap="round" />
        })}

        <rect {...big} fill={SKIN} opacity={0.5} mask={`url(#${uid}o)`} />
        <path d={creases} stroke={SKIN} strokeOpacity={0.25} strokeWidth={1.1} strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}
