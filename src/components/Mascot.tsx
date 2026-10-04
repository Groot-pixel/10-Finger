import { useId } from 'react'
import { MASCOT_ACCESSORY, MASCOT_BASE } from './mascotImage'

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
 * Eyes and mouth are drawn on top so the mood can change; accessories are separate 3D layers.
 * The anchor points below come from the renderer's camera (viewBox units).
 */
const EYES = [46.19, 53.81]
const EYE_Y = 21.7
const MOUTH = { l: [41.2, 38.6], r: [58.8, 38.6], mid: 39.0 }
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
        const r = mood === 'excited' ? 2.3 : 2.05
        const look = mood === 'sad' ? 0.5 : 0
        return EYES.map((x, i) => (
          <g key={x}>
            {/* safety eye like on the toy: light rim, glossy black bead, big catch-light */}
            <ellipse cx={x} cy={EYE_Y + 0.55} rx={r + 0.75} ry={r + 0.55} fill="#7a5a32" opacity="0.22" filter={`url(#${id}blur)`} />
            <circle cx={x} cy={EYE_Y} r={r + 0.45} fill="#efe7d6" />
            <circle cx={x} cy={EYE_Y + look} r={r} fill={`url(#${id}eye)`} />
            <ellipse cx={x - r * 0.3} cy={EYE_Y + look - r * 0.38} rx={r * 0.36} ry={r * 0.3} fill="#fff" />
            <circle cx={x + r * 0.4} cy={EYE_Y + look + r * 0.38} r={r * 0.14} fill="#fff" opacity="0.8" />
            {mood === 'sad' && (
              <path
                d={i === 0 ? `M${x - 2.4} ${EYE_Y - 3.3} Q${x} ${EYE_Y - 4.6} ${x + 2} ${EYE_Y - 4.4}` : `M${x - 2} ${EYE_Y - 4.4} Q${x} ${EYE_Y - 4.6} ${x + 2.4} ${EYE_Y - 3.3}`}
                stroke="#9a6a35"
                strokeWidth="0.8"
                fill="none"
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
          <g fill="none" strokeLinecap="round">
            <path d={`M${lx} ${ly + 0.35} Q50 ${MOUTH.mid + 2.3} ${rx} ${ry + 0.35}`} stroke="#8a6a40" strokeWidth="1.1" opacity="0.25" />
            <path d={`M${lx} ${ly} Q50 ${MOUTH.mid + 1.9} ${rx} ${ry}`} stroke={RED} strokeWidth="0.95" />
          </g>
        )
    }
  }

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
        <filter id={`${id}blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.35" />
        </filter>
        <filter id={`${id}soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* contact shadow on the ground */}
      <ellipse cx="50" cy="96.6" rx="24" ry="2.6" fill="#000" opacity="0.14" filter={`url(#${id}soft)`} />

      <image href={MASCOT_BASE} x="0" y="0" width="100" height="100" preserveAspectRatio="none" />

      {/* face */}
      {eyes()}
      {mouth()}

      {/* ---- accessories: 3D renders that sit exactly on the plush ---- */}
      {['mascot-bandana', 'mascot-cap', 'mascot-crown', 'mascot-sunglasses']
        .filter((a) => has(a) && MASCOT_ACCESSORY[a])
        .map((a) => (
          <image key={a} href={MASCOT_ACCESSORY[a]} x="0" y="0" width="100" height="100" preserveAspectRatio="none" />
        ))}
    </svg>
  )
}
