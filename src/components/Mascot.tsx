import { useId } from 'react'
import MASCOT_IMAGE from './mascotImage'

export type MascotMood = 'happy' | 'excited' | 'sad' | 'neutral' | 'sleepy' | 'love'

interface Props {
  mood?: MascotMood
  size?: number
  accessories?: string[]
  className?: string
  bounce?: boolean
}

/*
 * Flowy is a 3D render of a soft plush monkey (one continuous figure: fur, cream snout, belly button).
 * Eyes, mouth and accessories are drawn on top, so moods and outfits can change without re-rendering.
 * The anchor points below come from the renderer's camera (viewBox units).
 */
const EYES = [45.35, 54.65]
const EYE_Y = 26.1
const MOUTH = { l: [40.9, 42.9], r: [59.1, 42.9], mid: 43.8 }
const HEAD = { cx: 50, cy: 26.7, r: 16.4 }
const INK = '#1a120c'
const RED = '#c8323e'

function Heart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d="M0 3 C-1.7 -0.8 -7.4 -1 -7.4 3.3 C-7.4 6.8 -3.4 9.8 0 12.6 C3.4 9.8 7.4 6.8 7.4 3.3 C7.4 -1 1.7 -0.8 0 3 Z"
      fill="#ff3d55"
      transform={`translate(${x} ${y - 3.6 * s}) scale(${s})`}
    />
  )
}

export default function Mascot({ mood = 'happy', size = 96, accessories = [], className = '', bounce = false }: Props) {
  const id = useId().replace(/:/g, '')
  const has = (a: string) => accessories.includes(a)

  const eyes = () => {
    switch (mood) {
      case 'love':
        return EYES.map((x) => <Heart key={x} x={x} y={EYE_Y} s={0.44} />)
      case 'sleepy':
        return EYES.map((x) => (
          <path key={x} d={`M${x - 2.3} ${EYE_Y} Q${x} ${EYE_Y + 1.9} ${x + 2.3} ${EYE_Y}`} stroke={INK} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        ))
      default: {
        const r = mood === 'excited' ? 2.35 : 2.05
        return EYES.map((x, i) => (
          <g key={x}>
            {/* plastic safety eye: light rim, glossy black bead, two highlights */}
            <circle cx={x} cy={EYE_Y + 0.25} r={r + 0.65} fill="#000" opacity="0.18" />
            <circle cx={x} cy={EYE_Y} r={r + 0.5} fill="#f2ead8" />
            <circle cx={x} cy={EYE_Y} r={r} fill={`url(#${id}eye)`} />
            <circle cx={x + r * 0.32} cy={EYE_Y - r * 0.36} r={r * 0.32} fill="#fff" />
            <circle cx={x - r * 0.38} cy={EYE_Y + r * 0.42} r={r * 0.13} fill="#fff" opacity="0.7" />
            {mood === 'sad' && (
              <path
                d={i === 0 ? `M${x - 2.6} ${EYE_Y - 3.6} L${x + 1.8} ${EYE_Y - 4.8}` : `M${x - 1.8} ${EYE_Y - 4.8} L${x + 2.6} ${EYE_Y - 3.6}`}
                stroke="#8a5a2b"
                strokeWidth="1"
                strokeLinecap="round"
              />
            )}
          </g>
        ))
      }
    }
  }

  const [lx, ly] = MOUTH.l
  const [rx, ry] = MOUTH.r
  const mouth = () => {
    switch (mood) {
      case 'sad':
        return <path d={`M${lx + 4} ${ly + 1.2} Q50 ${MOUTH.mid - 1.6} ${rx - 4} ${ry + 1.2}`} stroke={RED} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      case 'excited':
        return (
          <g>
            <path d={`M${lx + 1} ${ly} Q50 ${MOUTH.mid + 1.2} ${rx - 1} ${ry} Q50 ${MOUTH.mid + 7.5} ${lx + 1} ${ly} Z`} fill="#5a1a22" />
            <path d={`M45.5 ${MOUTH.mid + 2.6} Q50 ${MOUTH.mid + 1.4} 54.5 ${MOUTH.mid + 2.6} Q50 ${MOUTH.mid + 5.4} 45.5 ${MOUTH.mid + 2.6} Z`} fill="#ff7d93" />
            <path d={`M${lx + 1} ${ly} Q50 ${MOUTH.mid + 1.2} ${rx - 1} ${ry}`} stroke={RED} strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
        )
      case 'sleepy':
        return <ellipse cx="50" cy={MOUTH.mid} rx="1.6" ry="1.2" fill="#5a1a22" />
      case 'neutral':
        return <path d={`M${lx + 3} ${ly + 0.6} Q50 ${MOUTH.mid + 0.4} ${rx - 3} ${ry + 0.6}`} stroke={RED} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      default:
        // the wide embroidered smile along the bottom of the snout
        return (
          <path d={`M${lx} ${ly} Q50 ${MOUTH.mid + 2.4} ${rx} ${ry}`} stroke={RED} strokeWidth="1.15" fill="none" strokeLinecap="round" />
        )
    }
  }

  // accessories were designed for a head centred at (50, 30) with radius 21
  const headFit = `translate(${HEAD.cx} ${HEAD.cy}) scale(${(HEAD.r / 21) * 1.05}) translate(-50 -30)`

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
        <radialGradient id={`${id}eye`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4b3a2c" />
          <stop offset="1" stopColor={INK} />
        </radialGradient>
        <filter id={`${id}soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* contact shadow on the ground */}
      <ellipse cx="50" cy="96.6" rx="24" ry="2.6" fill="#000" opacity="0.14" filter={`url(#${id}soft)`} />

      <image href={MASCOT_IMAGE} x="0" y="0" width="100" height="100" preserveAspectRatio="none" />

      {/* face */}
      {eyes()}
      {mouth()}

      {/* ---- accessories ---- */}

      {has('mascot-bandana') && (
        <g>
          <path d="M36 48.5 Q50 54 64 48.5 L63.4 53.4 Q50 59.8 36.6 53.4 Z" fill="#ff4b4b" />
          <path d="M43.5 55.8 L50 67 L56.5 55.8 Q50 58.4 43.5 55.8 Z" fill="#e53a3a" />
          {[
            [40, 53.2],
            [46.5, 55.8],
            [53.5, 55.8],
            [60, 53.2],
            [50, 62],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="#fff" opacity="0.85" />
          ))}
        </g>
      )}

      {has('mascot-sunglasses') && (
        <g>
          <path d={`M${EYES[0] - 8} ${EYE_Y - 1} H${EYES[1] + 8}`} stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          <rect x={EYES[0] - 5} y={EYE_Y - 3.8} width="9.6" height="7.4" rx="3" fill={INK} />
          <rect x={EYES[1] - 4.6} y={EYE_Y - 3.8} width="9.6" height="7.4" rx="3" fill={INK} />
          <path d={`M${EYES[0] - 3.2} ${EYE_Y - 1.8} h2 l-1.6 3.6`} stroke="#fff" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.4" />
          <path d={`M${EYES[1] - 2.8} ${EYE_Y - 1.8} h2 l-1.6 3.6`} stroke="#fff" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.4" />
        </g>
      )}

      {has('mascot-cap') && (
        <g transform={headFit}>
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
        <g transform={headFit}>
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
