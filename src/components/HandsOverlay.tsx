import { useEffect, useId, useRef, useState } from 'react'
import { FINGER_COLOR, fingerFor, shiftKeyFor, type FingerId } from '../data/keyboard'
import { HAND_FILLS as DRAWN_FILLS, HAND_STROKES as DRAWN_STROKES, type HandPart, type HandSide } from '../data/handArt'
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
const BASE_R: Record<HandPart, Point> = { pinky: { x: 1015, y: 509 }, ring: { x: 944, y: 501 }, middle: { x: 861, y: 519 }, index: { x: 765, y: 551 }, thumb: { x: 680, y: 620 } }
const TIP_R: Record<HandPart, Point> = { pinky: { x: 983, y: 283 }, ring: { x: 900, y: 283 }, middle: { x: 817, y: 283 }, index: { x: 734, y: 283 }, thumb: { x: 640, y: 425 } }

/*
 * The left hand is the mirror image of the (cleaner) right hand of the drawing. The drawing is almost
 * symmetric: mirrored about the middle between F and J, every right fingertip lands exactly on its left
 * home key (J→F, K→D, L→S, Ö→A). The left hand of the drawing hides its pinky behind the ring finger and
 * lets neighbouring fingers share contour lines, which looked patched together once a finger moved.
 */
const MIRROR_X = ANCHOR.L.x + ANCHOR.R.x
const mirrorPoint = (p: Point): Point => ({ x: MIRROR_X - p.x, y: p.y })
const mirrorPts = (pts: number[]): number[] => pts.map((v, i) => (i % 2 === 0 ? MIRROR_X - v : v))
const mirrorRecord = <T,>(rec: Record<string, T>, f: (v: T) => T) => Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, f(v)]))

const HAND_STROKES = { R: DRAWN_STROKES.R, L: mirrorRecord(DRAWN_STROKES.R, (lines) => lines.map(mirrorPts)) } as typeof DRAWN_STROKES
const HAND_FILLS = { R: DRAWN_FILLS.R, L: mirrorRecord(DRAWN_FILLS.R, mirrorPts) } as typeof DRAWN_FILLS
const BASE: Record<HandSide, Record<HandPart, Point>> = { R: BASE_R, L: mirrorRecord(BASE_R, mirrorPoint) as Record<HandPart, Point> }
const TIP: Record<HandSide, Record<HandPart, Point>> = { R: TIP_R, L: mirrorRecord(TIP_R, mirrorPoint) as Record<HandPart, Point> }
/**
 * How a hand reaches for a key, like a real one: it first turns a little at the wrist towards the key,
 * then slides a bit; the finger does the rest by turning and stretching/curling. The other fingers ride
 * along with the hand and only lean slightly back towards their home keys.
 */
const WRIST: Record<HandSide, Point> = { L: mirrorPoint({ x: 880, y: 860 }), R: { x: 880, y: 860 } }
const HAND_TURN_SHARE = 0.4
const MAX_HAND_TURN = 0.08
/** share of the finger's own part that the hand still takes over, so nothing looks frozen */
const HAND_SHARE = 0.12
/** how far (radians) a finger may swing sideways on its own, and how much it may curl or stretch */
const MAX_TURN = 0.1
const MIN_SCALE = 0.9
/** the (clean) pinky may curl much further on its own, e.g. down to shift */
const MIN_SCALE_PINKY = 0.6
const MAX_TURN_PINKY = 0.22
/** the left fingers (clean outlines while moving) may turn and curl a bit more, so the hand slides less */
const LEFT_LIMITS: Partial<Record<HandPart, { minScale: number; maxTurn: number }>> = {
  index: { minScale: 0.82, maxTurn: 0.3 },
  middle: { minScale: 0.78, maxTurn: 0.2 },
  ring: { minScale: 0.78, maxTurn: 0.18 },
}
const MAX_SCALE = 1.3
/** how much the other fingers lean back towards their home keys */
const PIN = 0.5
/** the left fingers stay closer to their home keys (they are drawn wider and would drift onto the next key) */
const PIN_LEFT = 0.75

const rotateAbout = (p: Point, c: Point, a: number): Point => {
  const cs = Math.cos(a)
  const sn = Math.sin(a)
  return { x: c.x + cs * (p.x - c.x) - sn * (p.y - c.y), y: c.y + sn * (p.x - c.x) + cs * (p.y - c.y) }
}
const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))

type Pts = number[]

/**
 * Turns one finger about its knuckle B and stretches or curls it along its own length so its tip T
 * lands on `target`. The finger keeps its width (a curled finger seen from above just looks shorter).
 * Turn and length change fade in from the knuckle (none) to the fingertip (full), so the finger bends
 * smoothly while its lines stay attached to the hand.
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
    // stretch only the part along the finger: the tip moves (scale-1)·L, everything below it proportionally
    const along = t <= 0 ? 0 : (scale - 1) * Math.min(t, 1)
    const qx = px + along * ax
    const qy = py + along * ay
    const c = Math.cos(angle * w)
    const s = Math.sin(angle * w)
    out[i] = B.x + c * qx - s * qy
    out[i + 1] = B.y + s * qx + c * qy
  }
  return out
}

/** contour lines a finger shares with its neighbour (stored with the neighbour) */
const BORROW: Record<HandSide, Partial<Record<HandPart, [HandPart, number]>>> = {
  L: { middle: ['index', 1], ring: ['middle', 1], pinky: ['ring', 1] },
  R: { middle: ['index', 1], ring: ['middle', 1], pinky: ['ring', 1] },
}

/**
 * The traced fingers are drawn very wide. Each finger's upper half is slimmed towards its own centre
 * line (root → top, reference pixels) by `n`. The lower half stays as drawn, so neighbouring fingers
 * keep sharing one contour line there and only part slightly at the fingertips, like in the drawing.
 */
const SLIM_R: Partial<Record<HandPart, { top: Point; root: Point; n: number }>> = {
  index: { top: { x: 742, y: 254 }, root: { x: 765, y: 551 }, n: 0.77 },
  middle: { top: { x: 817, y: 245 }, root: { x: 861, y: 519 }, n: 0.75 },
  ring: { top: { x: 895, y: 252 }, root: { x: 944, y: 501 }, n: 0.77 },
  pinky: { top: { x: 970, y: 265 }, root: { x: 1015, y: 509 }, n: 0.83 },
}
const SLIM: Record<HandSide, Partial<Record<HandPart, { top: Point; root: Point; n: number }>>> = {
  R: SLIM_R,
  L: mirrorRecord(SLIM_R as Record<string, { top: Point; root: Point; n: number }>, (v) => ({ top: mirrorPoint(v.top), root: mirrorPoint(v.root), n: v.n })),
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
    const u = Math.min(1, Math.max(0, (t - 0.15) / 0.45))
    const k = (1 - s.n) * u * u * (3 - 2 * u)
    // pull the point towards the centre line by k
    out[i] = pts[i] - k * (px - t * ax)
    out[i + 1] = pts[i + 1] - k * (py - t * ay)
  }
  return out
}

/** the slimmed rest shape of every finger: its own lines plus the line it shares with a neighbour */
const SHAPES: Record<HandSide, Record<HandPart, { strokes: Pts[]; fill: Pts }>> = (() => {
  const res = { L: {}, R: {} } as Record<HandSide, Record<HandPart, { strokes: Pts[]; fill: Pts }>>
  for (const hand of ['L', 'R'] as HandSide[]) {
    for (const part of ['pinky', 'ring', 'middle', 'index', 'thumb'] as HandPart[]) {
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

/**
 * Animates one finger tip: towards its key (ease-out), and when another finger takes over or the
 * finger is no longer needed, the same motion is played backwards so the finger glides home again
 * instead of jumping. Returns the moving tip and, while it is still on its way, the returning one.
 */
const TIP_MS = 160
function useFingerTip(id: string | null, home: Point | null, target: Point | null) {
  const [tip, setTip] = useState<Point | null>(null)
  const [back, setBack] = useState<{ id: string; pos: Point } | null>(null)
  const lastId = useRef<string | null>(null)
  const lastHome = useRef<Point | null>(null)
  const current = useRef<Point | null>(null)
  const backRef = useRef<{ id: string; pos: Point } | null>(null)
  const raf = useRef<number | null>(null)
  const rafBack = useRef<number | null>(null)

  useEffect(() => {
    const prevId = lastId.current
    // the previous finger leaves: play its way to the key backwards
    if (prevId && prevId !== id && current.current && lastHome.current) {
      const from = current.current
      const to = lastHome.current
      const start = performance.now()
      if (rafBack.current !== null) cancelAnimationFrame(rafBack.current)
      const stepBack = (now: number) => {
        const t = Math.min(1, (now - start) / TIP_MS)
        const e = t * t * t // reverse of the ease-out used on the way there
        const pos = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e }
        backRef.current = t < 1 ? { id: prevId, pos } : null
        setBack(backRef.current)
        if (t < 1) rafBack.current = requestAnimationFrame(stepBack)
      }
      rafBack.current = requestAnimationFrame(stepBack)
    }

    if (raf.current !== null) cancelAnimationFrame(raf.current)
    if (!id || !target || !home) {
      lastId.current = id
      lastHome.current = home
      current.current = null
      setTip(null)
      return
    }
    // start from where the finger is right now (also if it was just on its way home)
    let from = home
    if (prevId === id && current.current) from = current.current
    else if (backRef.current?.id === id) {
      from = backRef.current.pos
      if (rafBack.current !== null) cancelAnimationFrame(rafBack.current)
      backRef.current = null
      setBack(null)
    }
    lastId.current = id
    lastHome.current = home
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / TIP_MS)
      const e = 1 - Math.pow(1 - t, 3)
      const p = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e }
      current.current = p
      setTip(p)
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, home?.x, home?.y, target?.x, target?.y])

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
      if (rafBack.current !== null) cancelAnimationFrame(rafBack.current)
    },
    [],
  )

  return { tip, back }
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
  const letterMove = useFingerTip(letterFinger, homeOf(letterFinger), letterTarget)
  const shiftMove = useFingerTip(shiftTarget ? shiftFinger : null, homeOf(shiftFinger), shiftTarget)
  const letterTip = letterMove.tip
  const shiftTip = shiftMove.tip

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
  // fingers gliding back to their home keys (not highlighted any more)
  for (const back of [letterMove.back, shiftMove.back]) {
    if (!back) continue
    const { hand, part } = splitFinger(back.id as FingerId)
    if (part === 'thumb' || reach[hand][part]) continue
    reach[hand][part] = toRef(hand, back.pos)
  }

  const fills: string[] = []
  const strokes: { d: string; color: string | null }[] = []
  for (const hand of ['L', 'R'] as HandSide[]) {
    // the reach that decides how the whole hand moves: the longest one
    let lead: { T: Point; B: Point; t: Point; minScale: number; maxTurn: number } | null = null
    let longest = 0
    for (const f of FINGERS) {
      const t = reach[hand][f]
      if (!t) continue
      const d = Math.hypot(t.x - TIP[hand][f].x, t.y - TIP[hand][f].y)
      if (d <= longest) continue
      longest = d
      const left = hand === 'L' ? LEFT_LIMITS[f] : undefined
      lead = {
        T: TIP[hand][f],
        B: BASE[hand][f],
        t,
        minScale: left?.minScale ?? (f === 'pinky' ? MIN_SCALE_PINKY : MIN_SCALE),
        maxTurn: left?.maxTurn ?? (f === 'pinky' ? MAX_TURN_PINKY : MAX_TURN),
      }
    }
    const W = WRIST[hand]
    let angle = 0
    let shift: Point = { x: 0, y: 0 }
    if (lead) {
      const { T, B, t, minScale, maxTurn } = lead
      angle = clamp(HAND_TURN_SHARE * (Math.atan2(t.y - W.y, t.x - W.x) - Math.atan2(T.y - W.y, T.x - W.x)), MAX_HAND_TURN)
      const Tr = rotateAbout(T, W, angle)
      const Br = rotateAbout(B, W, angle)
      // split what is left of the reach into "along the finger" (it stretches / curls) and "sideways"
      // (it may turn a little) – whatever the finger can't do, the hand does by sliding
      const len0 = Math.hypot(T.x - B.x, T.y - B.y)
      const ux = (Tr.x - Br.x) / len0
      const uy = (Tr.y - Br.y) / len0
      const dx = t.x - Tr.x
      const dy = t.y - Tr.y
      const along = dx * ux + dy * uy
      const px = dx - along * ux
      const py = dy - along * uy
      const fAlong = Math.max((minScale - 1) * len0, Math.min((MAX_SCALE - 1) * len0, along))
      const side = Math.hypot(px, py)
      const fSide = side ? Math.min(1, (maxTurn * len0) / side) : 0
      const handX = (along - fAlong) * ux + px * (1 - fSide)
      const handY = (along - fAlong) * uy + py * (1 - fSide)
      shift = { x: handX + HAND_SHARE * (dx - handX), y: handY + HAND_SHARE * (dy - handY) }
    }
    // hand transform (reference space): turn about the wrist, then slide
    const toWorld = (p: Point): Point => {
      const r = rotateAbout(p, W, angle)
      return { x: r.x + shift.x, y: r.y + shift.y }
    }
    const toLocal = (p: Point): Point => rotateAbout({ x: p.x - shift.x, y: p.y - shift.y }, W, -angle)
    const base = toScreen(hand)
    const map = (x: number, y: number) => {
      const q = toWorld({ x, y })
      return base(q.x, q.y)
    }

    const shaped = (part: HandPart, pts: Pts) => {
      if (!longest) return pts
      const T = TIP[hand][part]
      const t = reach[hand][part]
      let goal: Point
      if (t) goal = toLocal(t)
      else {
        // ride along with the hand, leaning a little back towards the home key
        const moved = toWorld(T)
        const pin = part === 'thumb' ? 0.15 : hand === 'L' ? PIN_LEFT : PIN
        goal = toLocal({ x: moved.x + (T.x - moved.x) * pin, y: moved.y + (T.y - moved.y) * pin })
      }
      return bend(pts, BASE[hand][part], T, goal)
    }

    fills.push(toPath(HAND_FILLS[hand].palm, map, true))
    for (const line of HAND_STROKES[hand].palm) strokes.push({ d: toPath(line, map), color: null })
    for (const part of [...FINGERS, 'thumb'] as HandPart[]) {
      const shape = SHAPES[hand][part]
      fills.push(toPath(shaped(part, shape.fill), map, true))
      const color = active.find((f) => f.hand === hand && f.part === part)?.color ?? null
      for (const line of shape.strokes) strokes.push({ d: toPath(shaped(part, line), map), color })
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

        {/* one group, so a contour line shared by two fingers (drawn by both) doesn't get darker */}
        <g opacity={0.36}>
          {strokes
            .filter((s) => !s.color)
            .map((s, i) => (
              <path key={`s${i}`} d={s.d} fill="none" stroke={SKIN} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
            ))}
        </g>
        {/* a thin halo in the panel colour keeps the finger readable where it lies on its (same-coloured) key */}
        {strokes
          .filter((s) => s.color)
          .map((s, i) => (
            <path key={`h${i}`} d={s.d} fill="none" stroke="var(--kb-panel-bg)" strokeOpacity={0.6} strokeWidth={stroke * 2.2} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        {strokes
          .filter((s) => s.color)
          .map((s, i) => (
            <path key={`a${i}`} d={s.d} fill="none" stroke={s.color!} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
          ))}
      </g>
    </svg>
  )
}
