import { useId } from 'react'

export type MascotMood = 'happy' | 'excited' | 'sad' | 'neutral' | 'sleepy' | 'love'

interface Props {
  mood?: MascotMood
  size?: number
  accessories?: string[]
  className?: string
  bounce?: boolean
}

/* colours of the plush monkey: golden fur, cream face and belly, blue button, red mouth */
const FUR = '#e3a03c'
const FUR_DARK = '#b8731c'
const FUR_LIGHT = '#f7c873'
const OUTLINE = '#c07a24'
const CREAM_SHADE = '#e8d3a8'
const BUTTON_DARK = '#1f8eab'
const MOUTH = '#d9434f'
const INK = '#1c120a'
const PINK = '#ff9db0'

const EYE_Y = 27.5
const EYES = [44.5, 55.5]

/*
 * The whole plush silhouette – ears, head, body, arms and legs – is drawn as ONE figure: every part is
 * first drawn with a thick outline stroke and then filled on top, so only the outer contour of the whole
 * figure stays visible. A fine noise displacement makes that contour fluffy like real fur.
 */
const SILHOUETTE = (
  <>
    <ellipse cx="39" cy="88" rx="9" ry="7" />
    <ellipse cx="61" cy="88" rx="9" ry="7" />
    <ellipse cx="50" cy="70" rx="24" ry="21" />
    <ellipse cx="27.5" cy="70" rx="7" ry="14" transform="rotate(14 27.5 60)" />
    <ellipse cx="72.5" cy="70" rx="7" ry="14" transform="rotate(-14 72.5 60)" />
    <circle cx="28" cy="29" r="8.5" />
    <circle cx="72" cy="29" r="8.5" />
    <circle cx="50" cy="30" r="21" />
    <circle cx="41" cy="11.5" r="4" />
    <circle cx="50" cy="9.6" r="4.4" />
    <circle cx="59" cy="11.5" r="4" />
  </>
)

/** short fur strands: [x, y, angle in degrees, length, light?] */
const STRANDS: [number, number, number, number, boolean][] = (() => {
  const out: [number, number, number, number, boolean][] = []
  // around the top of the head
  for (let i = 0; i <= 12; i++) {
    const a = ((200 + i * 11.5) * Math.PI) / 180
    out.push([50 + Math.cos(a) * 18, 30 + Math.sin(a) * 18, (a * 180) / Math.PI + 90 + (i % 2 ? 18 : -14), 3.4, i % 3 === 0])
  }
  // along both sides of the body
  for (let i = 0; i < 6; i++) {
    const y = 58 + i * 5.4
    out.push([31 + Math.abs(i - 2.5) * 0.9, y, 100 + i * 3, 3, i % 2 === 0])
    out.push([69 - Math.abs(i - 2.5) * 0.9, y, 80 - i * 3, 3, i % 2 === 1])
  }
  // down the arms
  for (let i = 0; i < 4; i++) {
    out.push([24.5 + i * 0.8, 62 + i * 5, 95, 2.6, i % 2 === 0])
    out.push([75.5 - i * 0.8, 62 + i * 5, 85, 2.6, i % 2 === 1])
  }
  // on the legs
  out.push([36, 85, 120, 2.6, true], [42, 84, 70, 2.4, false], [58, 84, 110, 2.4, false], [64, 85, 60, 2.6, true])
  return out
})()

function Heart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d="M0 3 C-1.7 -0.8 -7.4 -1 -7.4 3.3 C-7.4 6.8 -3.4 9.8 0 12.6 C3.4 9.8 7.4 6.8 7.4 3.3 C7.4 -1 1.7 -0.8 0 3 Z"
      fill="#ff4b4b"
      transform={`translate(${x} ${y - 3.6 * s}) scale(${s})`}
    />
  )
}

/** Flowy – the app's mascot, a soft plush monkey */
export default function Mascot({ mood = 'happy', size = 96, accessories = [], className = '', bounce = false }: Props) {
  const id = useId().replace(/:/g, '')
  const url = (name: string) => `url(#${id}${name})`
  const has = (a: string) => accessories.includes(a)
  // the fluffy edge only pays off when the mascot is big enough to see it
  const fluffy = size >= 44

  const eyes = () => {
    switch (mood) {
      case 'love':
        return EYES.map((x) => <Heart key={x} x={x} y={EYE_Y} s={0.5} />)
      case 'sleepy':
        return EYES.map((x) => (
          <path key={x} d={`M${x - 3} ${EYE_Y} Q${x} ${EYE_Y + 2.6} ${x + 3} ${EYE_Y}`} stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        ))
      default: {
        const r = mood === 'excited' ? 3.3 : 2.9
        return EYES.map((x, i) => (
          <g key={x}>
            {/* glossy bead eyes with a little rim */}
            <circle cx={x} cy={EYE_Y + 0.4} r={r + 0.7} fill={CREAM_SHADE} />
            <circle cx={x} cy={EYE_Y} r={r} fill={url('eye')} />
            <circle cx={x + r * 0.35} cy={EYE_Y - r * 0.38} r={r * 0.34} fill="#fff" />
            <circle cx={x - r * 0.4} cy={EYE_Y + r * 0.45} r={r * 0.14} fill="#fff" opacity="0.7" />
            {mood === 'sad' && (
              <path
                d={i === 0 ? `M${x - 3.6} ${EYE_Y - 4.2} L${x + 2.6} ${EYE_Y - 6}` : `M${x - 2.6} ${EYE_Y - 6} L${x + 3.6} ${EYE_Y - 4.2}`}
                stroke={FUR_DARK}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </g>
        ))
      }
    }
  }

  const mouth = () => {
    switch (mood) {
      case 'sad':
        return <path d="M43 47 Q50 43.5 57 47" stroke={MOUTH} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      case 'excited':
        return (
          <g>
            <path d="M40 42.5 Q50 53 60 42.5 Q50 45.5 40 42.5 Z" fill="#7a2530" />
            <path d="M45 47.2 Q50 45.4 55 47.2 Q50 50.2 45 47.2 Z" fill={PINK} />
          </g>
        )
      case 'sleepy':
        return <ellipse cx="50" cy="45.5" rx="2" ry="1.6" fill="#7a2530" />
      case 'neutral':
        return <path d="M43 45 Q50 46.5 57 45" stroke={MOUTH} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      default:
        // embroidered smile: a red seam with tiny stitch marks
        return (
          <g>
            <path d="M40.5 43 Q50 49.5 59.5 43" stroke={MOUTH} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M40.5 43 Q50 49.5 59.5 43" stroke="#fff" strokeWidth="0.35" strokeDasharray="0.6 2.2" fill="none" opacity="0.5" />
          </g>
        )
    }
  }

  const bandana = has('mascot-bandana') && (
    <g>
      <path d="M31 50 Q50 59 69 50 L68 56.5 Q50 66 32 56.5 Z" fill="#ff4b4b" />
      <path d="M42.5 59 L50 72 L57.5 59 Q50 62 42.5 59 Z" fill="#e53a3a" />
      {[
        [37, 56],
        [45, 59.6],
        [55, 59.6],
        [63, 56],
        [50, 66],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#fff" opacity="0.85" />
      ))}
    </g>
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${bounce ? 'animate-bounce' : ''}`}
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Flowy, der Kuschelaffe"
    >
      <defs>
        <radialGradient id={`${id}fur`} cx="0.38" cy="0.3" r="0.85">
          <stop offset="0" stopColor={FUR_LIGHT} />
          <stop offset="0.55" stopColor={FUR} />
          <stop offset="1" stopColor="#c8862a" />
        </radialGradient>
        <radialGradient id={`${id}cream`} cx="0.42" cy="0.38" r="0.75">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="0.6" stopColor="#f9efdb" />
          <stop offset="1" stopColor={CREAM_SHADE} />
        </radialGradient>
        <radialGradient id={`${id}button`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#7fdcf0" />
          <stop offset="0.6" stopColor="#3cb9d6" />
          <stop offset="1" stopColor={BUTTON_DARK} />
        </radialGradient>
        <radialGradient id={`${id}eye`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4a3a2e" />
          <stop offset="1" stopColor={INK} />
        </radialGradient>
        <filter id={`${id}fuzz`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${id}soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
        <clipPath id={`${id}body`}>
          <ellipse cx="50" cy="70" rx="24" ry="21" />
        </clipPath>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="50" cy="96" rx="27" ry="3.2" fill="#000" opacity="0.1" filter={url('soft')} />

      {/* ---- one continuous plush figure ---- */}
      <g filter={fluffy ? url('fuzz') : undefined}>
        <g fill={OUTLINE} stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round">
          {SILHOUETTE}
        </g>
        <g fill={url('fur')}>{SILHOUETTE}</g>

        {/* soft shading where the parts meet, instead of hard lines */}
        <g fill={FUR_DARK} filter={url('soft')} opacity="0.55">
          <ellipse cx="50" cy="53" rx="17" ry="4" />
          <ellipse cx="33" cy="70" rx="2.6" ry="11" transform="rotate(14 33 70)" />
          <ellipse cx="67" cy="70" rx="2.6" ry="11" transform="rotate(-14 67 70)" />
          <ellipse cx="50" cy="86" rx="10" ry="2.4" />
        </g>
        {/* belly fabric patch (short pile), sewn into the fur */}
        <ellipse cx="50" cy="73" rx="13.2" ry="14.2" fill={url('cream')} />
        <ellipse cx="50" cy="73" rx="11.6" ry="12.6" fill="none" stroke={CREAM_SHADE} strokeWidth="0.5" strokeDasharray="1.2 1.2" />
        {/* ears: cream inside */}
        <circle cx="28" cy="29.4" r="5.2" fill={url('cream')} />
        <circle cx="72" cy="29.4" r="5.2" fill={url('cream')} />
        <path d="M24.5 31 Q28 26 31.5 31" stroke={CREAM_SHADE} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M68.5 31 Q72 26 75.5 31" stroke={CREAM_SHADE} strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>

      {/* fur strands for texture */}
      <g strokeLinecap="round" fill="none">
        {STRANDS.map(([x, y, deg, len, light], i) => {
          const a = (deg * Math.PI) / 180
          const ex = x + Math.cos(a) * len
          const ey = y + Math.sin(a) * len
          const mx = (x + ex) / 2 + Math.cos(a + Math.PI / 2) * 0.8
          const my = (y + ey) / 2 + Math.sin(a + Math.PI / 2) * 0.8
          return (
            <path
              key={i}
              d={`M${x.toFixed(2)} ${y.toFixed(2)} Q${mx.toFixed(2)} ${my.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`}
              stroke={light ? FUR_LIGHT : FUR_DARK}
              strokeWidth="0.9"
              opacity={light ? 0.9 : 0.55}
            />
          )
        })}
      </g>

      {/* the blue button, sewn on with a cross stitch */}
      <ellipse cx="50.4" cy="78" rx="4.6" ry="4.3" fill="#000" opacity="0.12" filter={url('soft')} />
      <circle cx="50" cy="77" r="4.5" fill={url('button')} />
      <circle cx="50" cy="77" r="3.2" fill="none" stroke={BUTTON_DARK} strokeWidth="0.7" opacity="0.8" />
      <path d="M48.3 75.3 L51.7 78.7 M51.7 75.3 L48.3 78.7" stroke={BUTTON_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M47.2 75.2 Q48.6 73.8 50.4 73.6" stroke="#fff" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7" />

      {bandana}

      {/* face: the big soft cream snout, with fur reaching a little over its upper edge */}
      <path
        d="M50 16 C58.5 16 62 21.5 62.5 27 C70.5 31 70 53 50 53 C30 53 29.5 31 37.5 27 C38 21.5 41.5 16 50 16 Z"
        fill={url('cream')}
      />
      <ellipse cx="50" cy="44.5" rx="15" ry="7.5" fill={CREAM_SHADE} opacity="0.35" filter={url('soft')} />
      <ellipse cx="44" cy="35.5" rx="6" ry="2.6" fill="#fff" opacity="0.7" filter={url('soft')} />
      <g stroke={FUR} strokeWidth="1" strokeLinecap="round" fill="none">
        <path d="M44 16.8 q1 1.6 0.4 3" />
        <path d="M48 16 q0.8 1.8 0.2 3.2" />
        <path d="M52.4 16 q-0.6 1.8 0 3.2" />
        <path d="M56.4 16.8 q-1 1.6 -0.4 3" />
      </g>

      {/* cheeks */}
      {(mood === 'happy' || mood === 'excited' || mood === 'love') && (
        <>
          <ellipse cx="37" cy="39" rx="3.6" ry="2.2" fill={PINK} opacity="0.55" filter={url('soft')} />
          <ellipse cx="63" cy="39" rx="3.6" ry="2.2" fill={PINK} opacity="0.55" filter={url('soft')} />
        </>
      )}

      {eyes()}
      {/* little embroidered nose */}
      <ellipse cx="50" cy="34.4" rx="3" ry="1.7" fill={CREAM_SHADE} opacity="0.8" />
      <circle cx="48.6" cy="34.6" r="0.65" fill="#9a7048" />
      <circle cx="51.4" cy="34.6" r="0.65" fill="#9a7048" />
      {mouth()}

      {/* ---- accessories on the head ---- */}

      {has('mascot-sunglasses') && (
        <g>
          <path d="M30 26 H70" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <rect x="35" y="22" width="14.5" height="11" rx="4.5" fill={INK} />
          <rect x="50.5" y="22" width="14.5" height="11" rx="4.5" fill={INK} />
          <path d="M37.5 25 L40.5 25 L38.2 30" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4" />
          <path d="M53 25 L56 25 L53.7 30" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4" />
        </g>
      )}

      {has('mascot-cap') && (
        <g>
          <path d="M30 15 C30 -4 70 -4 70 15 Z" fill="#1cb0f6" />
          <path d="M50 -1.5 C61 -1.5 70 3.5 70 15 L58 15 C58 5 55 -0.6 50 -1.5 Z" fill="#1899d6" />
          <path d="M50 -2 V15" stroke="#1480b3" strokeWidth="1.1" />
          <ellipse cx="50" cy="16" rx="24" ry="4.4" fill="#1480b3" />
          <ellipse cx="50" cy="15.2" rx="23" ry="3.3" fill="#1cb0f6" />
          <circle cx="50" cy="-2.2" r="2" fill="#1480b3" />
          <path d="M36 3.5 Q40 1 44 0.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.4" />
        </g>
      )}

      {has('mascot-crown') && (
        <g>
          <path d="M35 12 L33 -1 L42 5 L50 -4 L58 5 L67 -1 L65 12 Q50 9 35 12 Z" fill="#ffc800" />
          <path d="M35 12 Q50 9 65 12 L65 15.5 Q50 12.5 35 15.5 Z" fill="#e5a400" />
          <circle cx="50" cy="6.5" r="2.2" fill="#ff4b4b" />
          <circle cx="41.5" cy="9" r="1.5" fill="#1cb0f6" />
          <circle cx="58.5" cy="9" r="1.5" fill="#1cb0f6" />
          <circle cx="33" cy="-1" r="1.5" fill="#ffc800" />
          <circle cx="50" cy="-4" r="1.5" fill="#ffc800" />
          <circle cx="67" cy="-1" r="1.5" fill="#ffc800" />
        </g>
      )}
    </svg>
  )
}
