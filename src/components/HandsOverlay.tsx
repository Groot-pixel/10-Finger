import { useEffect, useId, useRef, useState } from 'react'
import { FINGER_COLOR, fingerFor, shiftKeyFor, type FingerId } from '../data/keyboard'
import { HAND_FILLS, HAND_STROKES, type HandPart, type HandSide } from '../data/handArt'
import type { Point } from '../hooks/useKeyRects'

interface Props {
  keyRects: Map<string, Point>
  nextChar: string | null
}

const SKIN = 'var(--kb-key-fg)'

/* ---- reference drawing geometry (see data/handArt.ts) ---- */
const REF_PITCH = 83.1
const REF_HOME_Y = 283
const REF_SPACE_Y = 451
/** key the hand is anchored to in the reference drawing and in the app */
const ANCHOR: Record<HandSide, { key: string; x: number }> = { L: { key: 'f', x: 485 }, R: { key: 'j', x: 734 } }
const FINGERS: Exclude<HandPart, 'thumb'>[] = ['pinky', 'ring', 'middle', 'index']
const HOME_KEY: Record<HandSide, Record<Exclude<HandPart, 'thumb'>, string>> = {
  L: { pinky: 'a', ring: 's', middle: 'd', index: 'f' },
  R: { pinky: 'ö', ring: 'l', middle: 'k', index: 'j' },
}
/** where each finger leaves the palm (B) and where its tip rests (T), in reference pixels */
const BASE: Record<HandSide, Record<HandPart, Point>> = {
  L: { pinky: { x: 175, y: 520 }, ring: { x: 235, y: 520 }, middle: { x: 330, y: 520 }, index: { x: 420, y: 540 }, thumb: { x: 470, y: 640 } },
  R: { pinky: { x: 1010, y: 540 }, ring: { x: 915, y: 540 }, middle: { x: 820, y: 560 }, index: { x: 720, y: 560 }, thumb: { x: 680, y: 620 } },
}
const TIP: Record<HandSide, Record<HandPart, Point>> = {
  L: { pinky: { x: 236, y: 283 }, ring: { x: 319, y: 283 }, middle: { x: 401, y: 283 }, index: { x: 485, y: 283 }, thumb: { x: 520, y: 445 } },
  R: { pinky: { x: 983, y: 283 }, ring: { x: 900, y: 283 }, middle: { x: 817, y: 283 }, index: { x: 734, y: 283 }, thumb: { x: 640, y: 425 } },
}
/** share of a reach (in reference px) that the whole hand takes over – the further the key, the more the hand moves */
const handFollow = (dist: number) => Math.min(0.68, 0.18 + dist / 380)
const MAX_FOLLOW = 0.85
/** how far (radians) a finger may swing sideways on its own, and how much it may shorten (curl) */
const MAX_TURN = 0.3
const MIN_SCALE = 0.74
/** how firmly the other fingers stay on their home keys while the hand moves */
const PIN = 0.85

type Pts = number[]

/**
 * Turns and stretches one finger about its knuckle B so its tip T lands on `target`.
 * The rotation and scaling fade in from the knuckle (none) to the fingertip (full),
 * so the finger bends smoothly while its lines stay attached to the hand.
 */
function bend(pts: Pts, B: Point, T: Point, target: Point): Pts {
  const ax = T.x - B.x
  const ay = T.y - B.y
  const L2 = ax * ax + ay * ay || 1
  const bx = target.x - B.x
  const by = target.y - B.y
  const angle = Math.atan2(by, bx) - Math.atan2(ay, ax)
  const scale = Math.sqrt((bx * bx + by * by) / L2)
  const out: Pts = new Array(pts.length)
  for (let i = 0; i < pts.length; i += 2) {
    const px = pts[i] - B.x
    const py = pts[i + 1] - B.y
    const t = (px * ax + py * ay) / L2
    const w = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)
    const c = Math.cos(angle * w)
    const s = Math.sin(angle * w)
    const k = 1 + (scale - 1) * w
    out[i] = B.x + k * (c * px - s * py)
    out[i + 1] = B.y + k * (s * px + c * py)
  }
  return out
}

/** contour lines a finger shares with its neighbour (stored with the neighbour) */
const BORROW: Record<HandSide, Partial<Record<HandPart, [HandPart, number]>>> = {
  L: { ring: ['middle', 1] },
  R: { middle: ['index', 1], ring: ['middle', 1], pinky: ['ring', 1] },
}

/**
 * The traced fingers are drawn very wide (wider than a key). Each finger is slimmed towards its own
 * centre line (root → top, reference pixels) by `n` (n > 1 widens); the effect fades in above the knuckles so the
 * fingers still grow out of one palm.
 */
const SLIM: Record<HandSide, Partial<Record<HandPart, { top: Point; root: Point; n: number }>>> = {
  L: {
    ring: { top: { x: 318, y: 258 }, root: { x: 197, y: 498 }, n: 0.8 },
    middle: { top: { x: 405, y: 258 }, root: { x: 292, y: 487 }, n: 0.74 },
    index: { top: { x: 487, y: 259 }, root: { x: 395, y: 538 }, n: 0.76 },
  },
  R: {
    index: { top: { x: 742, y: 254 }, root: { x: 765, y: 551 }, n: 0.74 },
    middle: { top: { x: 817, y: 245 }, root: { x: 861, y: 519 }, n: 0.7 },
    ring: { top: { x: 895, y: 252 }, root: { x: 944, y: 501 }, n: 0.76 },
    pinky: { top: { x: 970, y: 265 }, root: { x: 1015, y: 509 }, n: 0.88 },
  },
}

function slim(pts: Pts, hand: HandSide, part: HandPart): Pts {
  const s = SLIM[hand][part]
  if (!s) return pts
  const ax = s.top.x - s.root.x
  const ay = s.top.y - s.root.y
  const L2 = ax * ax + ay * ay
  const out: Pts = new Array(pts.length)
  for (let i = 0; i < pts.length; i += 2) {
    const px = pts[i] - s.root.x
    const py = pts[i + 1] - s.root.y
    const t = (px * ax + py * ay) / L2
    const u = Math.min(1, Math.max(0, t / 0.4))
    const k = (1 - s.n) * u * u * (3 - 2 * u)
    // pull the point towards the centre line by k
    out[i] = pts[i] - k * (px - t * ax)
    out[i + 1] = pts[i + 1] - k * (py - t * ay)
  }
  return out
}

/**
 * A clean, rounded finger outline (one U-shaped line) from its root to the centre of its tip.
 * Used for the left pinky, which the drawing hides almost completely behind the ring finger.
 */
function fingerOutline(root: Point, tip: Point, halfRoot: number, halfTip: number): Pts {
  const ax = tip.x - root.x
  const ay = tip.y - root.y
  const len = Math.hypot(ax, ay)
  const dx = ax / len
  const dy = ay / len
  const nx = -dy // normal pointing to the finger's left side
  const ny = dx
  const left: Pts = []
  const right: Pts = []
  for (let i = 0; i <= 12; i++) {
    const t = -0.08 + (1.08 * i) / 12
    const h = halfRoot + (halfTip - halfRoot) * Math.max(0, t)
    left.push(root.x + ax * t + nx * h, root.y + ay * t + ny * h)
    right.push(root.x + ax * t - nx * h, root.y + ay * t - ny * h)
  }
  const cap: Pts = []
  for (let i = 1; i < 10; i++) {
    const a = (Math.PI * i) / 10
    cap.push(tip.x + nx * halfTip * Math.cos(a) + dx * halfTip * Math.sin(a), tip.y + ny * halfTip * Math.cos(a) + dy * halfTip * Math.sin(a))
  }
  const back: Pts = []
  for (let i = right.length - 2; i >= 0; i -= 2) back.push(right[i], right[i + 1])
  return [...left, ...cap, ...back]
}
const PINKY_L = fingerOutline({ x: 136, y: 508 }, { x: 233, y: 292 }, 21, 19)

/** the slimmed rest shape of every finger: its own lines plus the line it shares with a neighbour */
const SHAPES: Record<HandSide, Record<HandPart, { strokes: Pts[]; fill: Pts }>> = (() => {
  const res = { L: {}, R: {} } as Record<HandSide, Record<HandPart, { strokes: Pts[]; fill: Pts }>>
  for (const hand of ['L', 'R'] as HandSide[]) {
    for (const part of ['pinky', 'ring', 'middle', 'index', 'thumb'] as HandPart[]) {
      if (hand === 'L' && part === 'pinky') {
        res.L.pinky = { strokes: [PINKY_L], fill: PINKY_L }
        continue
      }
      const lines = [...HAND_STROKES[hand][part]]
      const borrowed = BORROW[hand][part]
      if (borrowed) lines.push(HAND_STROKES[hand][borrowed[0]][borrowed[1]])
      res[hand][part] = { strokes: lines.map((l) => slim(l, hand, part)), fill: slim(HAND_FILLS[hand][part], hand, part) }
    }
  }
  return res
})()

/** smooth Catmull-Rom curve through the points, already mapped to screen space */
function toPath(pts: Pts, map: (x: number, y: number) => [number, number], closed = false): string {
  const p: [number, number][] = []
  for (let i = 0; i < pts.length; i += 2) p.push(map(pts[i], pts[i + 1]))
  if (p.length < 2) return ''
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
  const n = p.length
  for (let i = 0; i < n - 1; i++) {
    const p0 = p[closed ? (i - 1 + n) % n : Math.max(0, i - 1)]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[closed ? (i + 2) % n : Math.min(n - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return closed ? d + ' Z' : d
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
    const dur = 160
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

function splitFinger(f: FingerId): { hand: HandSide; part: HandPart } {
  const [h, p] = f.split('-') as [HandSide, HandPart]
  return { hand: h, part: p }
}

export default function HandsOverlay({ keyRects, nextChar }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

  const a = keyRects.get('a')
  const s = keyRects.get('s')
  const space = keyRects.get(' ')
  const anchorL = keyRects.get(ANCHOR.L.key)
  const anchorR = keyRects.get(ANCHOR.R.key)
  const ready = !!(a && s && space && anchorL && anchorR)
  const u = ready ? Math.abs(s!.x - a!.x) : 0
  const homeY = ready ? a!.y : 0
  const sx = u / REF_PITCH
  const sy = ready ? (space!.y - homeY) / (REF_SPACE_Y - REF_HOME_Y) : 1

  // which finger(s) leave their resting place for the next character
  const letterFinger = nextChar ? fingerFor(nextChar) : null
  const letterTarget = !nextChar || nextChar === ' ' ? null : keyRects.get(nextChar.toLowerCase()) ?? null
  // shift is pressed by the pinky of the other hand
  const shiftKey = nextChar ? shiftKeyFor(nextChar) : null
  const shiftTarget = shiftKey ? keyRects.get(shiftKey) ?? null : null
  const shiftFinger: FingerId = shiftKey === 'shiftL' ? 'L-pinky' : 'R-pinky'

  const homeOf = (f: FingerId | null): Point | null => {
    if (!f || !ready) return null
    const { hand, part } = splitFinger(f)
    if (part === 'thumb') return null
    return keyRects.get(HOME_KEY[hand][part]) ?? null
  }
  const letterTip = useFingerTip(letterFinger, homeOf(letterFinger), letterTarget)
  const shiftTip = useFingerTip(shiftTarget ? shiftKey : null, homeOf(shiftFinger), shiftTarget)

  if (!ready || u < 4) return null

  const toScreen = (hand: HandSide) => {
    const anchor = hand === 'L' ? anchorL! : anchorR!
    return (x: number, y: number): [number, number] => [anchor.x + (x - ANCHOR[hand].x) * sx, homeY + (y - REF_HOME_Y) * sy]
  }
  const toRef = (hand: HandSide, p: Point): Point => {
    const anchor = hand === 'L' ? anchorL! : anchorR!
    return { x: ANCHOR[hand].x + (p.x - anchor.x) / sx, y: REF_HOME_Y + (p.y - homeY) / sy }
  }

  // active fingers with their target in reference space
  const reach: Record<HandSide, Partial<Record<HandPart, Point>>> = { L: {}, R: {} }
  const active: { hand: HandSide; part: HandPart; target: Point | null; color: string }[] = []
  if (letterFinger) {
    const { hand, part } = splitFinger(letterFinger)
    if (part !== 'thumb' && letterTip) reach[hand][part] = toRef(hand, letterTip)
    active.push({ hand, part, target: part === 'thumb' ? space! : letterTip, color: FINGER_COLOR[letterFinger] })
  }
  if (shiftTip && letterFinger !== shiftFinger) {
    const { hand } = splitFinger(shiftFinger)
    reach[hand].pinky = toRef(hand, shiftTip)
    active.push({ hand, part: 'pinky', target: shiftTip, color: FINGER_COLOR[shiftFinger] })
  }

  const fills: string[] = []
  const strokes: { d: string; color: string | null; behind?: boolean }[] = []
  let ringL = ''
  for (const hand of ['L', 'R'] as HandSide[]) {
    // the hand follows the longest reach part of the way (more for far keys and for keys the finger
    // could only reach by turning sharply), so the finger itself never over-stretches or lies down flat
    let shift: Point = { x: 0, y: 0 }
    let longest = 0
    for (const f of FINGERS) {
      const t = reach[hand][f]
      if (!t) continue
      const T = TIP[hand][f]
      const B = BASE[hand][f]
      const dx = t.x - T.x
      const dy = t.y - T.y
      if (Math.hypot(dx, dy) <= longest) continue
      longest = Math.hypot(dx, dy)
      let k = handFollow(longest)
      for (; k < MAX_FOLLOW; k += 0.04) {
        const gx = t.x - dx * k - B.x
        const gy = t.y - dy * k - B.y
        const turn = Math.atan2(gy, gx) - Math.atan2(T.y - B.y, T.x - B.x)
        const scale = Math.hypot(gx, gy) / Math.hypot(T.x - B.x, T.y - B.y)
        if (Math.abs(turn) <= MAX_TURN && scale >= MIN_SCALE) break
      }
      shift = { x: dx * k, y: dy * k }
    }
    const base = toScreen(hand)
    const map = (x: number, y: number) => base(x + shift.x, y + shift.y)

    const shaped = (part: HandPart, pts: Pts) => {
      if (!longest) return pts
      const T = TIP[hand][part]
      const t = reach[hand][part]
      const pin = part === 'thumb' ? 0.3 : PIN
      const goal = t ? { x: t.x - shift.x, y: t.y - shift.y } : { x: T.x - pin * shift.x, y: T.y - pin * shift.y }
      return bend(pts, BASE[hand][part], T, goal)
    }

    fills.push(toPath(HAND_FILLS[hand].palm, map, true))
    for (const line of HAND_STROKES[hand].palm) strokes.push({ d: toPath(line, map), color: null })
    for (const part of [...FINGERS, 'thumb'] as HandPart[]) {
      const shape = SHAPES[hand][part]
      const fill = toPath(shaped(part, shape.fill), map, true)
      fills.push(fill)
      if (hand === 'L' && part === 'ring') ringL = fill
      const color = active.find((f) => f.hand === hand && f.part === part)?.color ?? null
      // the left pinky lies behind the ring finger
      const behind = hand === 'L' && part === 'pinky'
      for (const line of shape.strokes) strokes.push({ d: toPath(shaped(part, line), map), color, behind })
    }
  }

  const stroke = Math.max(1.4, 3.4 * sx)
  const fadeStart = homeY + 3.2 * u
  const fadeEnd = homeY + 5 * u
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
        <linearGradient id={`${uid}fg`} gradientUnits="userSpaceOnUse" x1={0} y1={fadeStart} x2={0} y2={fadeEnd}>
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id={`${uid}f`} maskUnits="userSpaceOnUse" {...big}>
          <rect {...big} fill={`url(#${uid}fg)`} />
        </mask>
        <mask id={`${uid}b`} maskUnits="userSpaceOnUse" {...big}>
          <rect {...big} fill="white" />
          <path d={ringL} fill="black" stroke="black" strokeWidth={stroke * 0.6} />
        </mask>
      </defs>

      <g mask={`url(#${uid}f)`}>
        {/* faint skin tone, drawn as one group so overlapping finger shapes don't stack up darker */}
        <g opacity={0.04}>
          {fills.map((d, i) => (
            <path key={i} d={d} fill={SKIN} />
          ))}
        </g>

        {/* soft rings of light around the key that has to be pressed, in the colour of the finger */}
        {active.map((f, i) =>
          f.target ? (
            <g key={`r${i}`} fill={f.color}>
              <circle cx={f.target.x} cy={f.target.y} r={1.08 * u} opacity={0.07} />
              <circle cx={f.target.x} cy={f.target.y} r={0.8 * u} opacity={0.08} />
              <circle cx={f.target.x} cy={f.target.y} r={0.56 * u} opacity={0.1} />
            </g>
          ) : null,
        )}

        {strokes
          .filter((s) => !s.color)
          .map((s, i) => (
            <path key={`s${i}`} mask={s.behind ? `url(#${uid}b)` : undefined} d={s.d} fill="none" stroke={SKIN} strokeOpacity={0.36} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        {/* a thin halo in the panel colour keeps the finger readable where it lies on its (same-coloured) key */}
        {strokes
          .filter((s) => s.color)
          .map((s, i) => (
            <path key={`h${i}`} mask={s.behind ? `url(#${uid}b)` : undefined} d={s.d} fill="none" stroke="var(--kb-panel-bg)" strokeOpacity={0.6} strokeWidth={stroke * 2.2} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        {strokes
          .filter((s) => s.color)
          .map((s, i) => (
            <path key={`a${i}`} mask={s.behind ? `url(#${uid}b)` : undefined} d={s.d} fill="none" stroke={s.color!} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
          ))}
      </g>
    </svg>
  )
}
