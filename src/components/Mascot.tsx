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
const FUR_DARK = '#c98526'
const FUR_LIGHT = '#f2bd62'
const CREAM = '#fbf3e1'
const CREAM_SHADE = '#eee0c2'
const BUTTON = '#3cb9d6'
const BUTTON_DARK = '#2896b2'
const MOUTH = '#e0505a'
const INK = '#2a1d12'
const PINK = '#ff9db0'

/** the big, puffy cream face: narrow around the eyes, wide round snout below */
const FACE = 'M50 16 C58.5 16 62 21.5 62.5 27 C70.5 31 70 53 50 53 C30 53 29.5 31 37.5 27 C38 21.5 41.5 16 50 16 Z'
const EYE_Y = 27.5
const EYES = [44.5, 55.5]

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
  const uid = useId().replace(/:/g, '')
  const has = (id: string) => accessories.includes(id)

  const eyes = () => {
    switch (mood) {
      case 'love':
        return EYES.map((x) => <Heart key={x} x={x} y={EYE_Y} s={0.5} />)
      case 'sleepy':
        return EYES.map((x) => (
          <path key={x} d={`M${x - 3} ${EYE_Y} Q${x} ${EYE_Y + 2.6} ${x + 3} ${EYE_Y}`} stroke={INK} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        ))
      default: {
        const r = mood === 'excited' ? 3.2 : 2.8
        return EYES.map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={EYE_Y} r={r} fill={INK} />
            <circle cx={x + 1} cy={EYE_Y - 1.1} r={r * 0.36} fill="#fff" />
            {mood === 'sad' && (
              <path
                d={i === 0 ? `M${x - 3.6} ${EYE_Y - 4.2} L${x + 2.6} ${EYE_Y - 6}` : `M${x - 2.6} ${EYE_Y - 6} L${x + 3.6} ${EYE_Y - 4.2}`}
                stroke={FUR_DARK}
                strokeWidth="1.6"
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
        return <path d="M43 47 Q50 43.5 57 47" stroke={MOUTH} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      case 'excited':
        return (
          <g>
            <path d="M40 42.5 Q50 53 60 42.5 Q50 45.5 40 42.5 Z" fill="#8a2a33" />
            <path d="M45 47.2 Q50 45.4 55 47.2 Q50 50.2 45 47.2 Z" fill={PINK} />
          </g>
        )
      case 'sleepy':
        return <ellipse cx="50" cy="45.5" rx="2" ry="1.6" fill="#8a2a33" />
      case 'neutral':
        return <path d="M43 45 Q50 46.5 57 45" stroke={MOUTH} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      default:
        return <path d="M40.5 43 Q50 49.5 59.5 43" stroke={MOUTH} strokeWidth="1.8" fill="none" strokeLinecap="round" />
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
        <clipPath id={`${uid}b`}>
          <ellipse cx="50" cy="70" rx="24" ry="21" />
        </clipPath>
        <clipPath id={`${uid}h`}>
          <circle cx="50" cy="30" r="21" />
        </clipPath>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="50" cy="96" rx="27" ry="3" fill="#000" opacity="0.08" />

      {/* stubby legs */}
      {[39, 61].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="89" rx="9" ry="7" fill={FUR_DARK} />
          <ellipse cx={x} cy="88" rx="8.4" ry="6.2" fill={FUR} />
        </g>
      ))}

      {/* round plush body with the cream belly and the blue button */}
      <ellipse cx="50" cy="70" rx="24" ry="21" fill={FUR} />
      <g clipPath={`url(#${uid}b)`}>
        <ellipse cx="68" cy="82" rx="18" ry="22" fill={FUR_DARK} opacity="0.35" />
        <ellipse cx="38" cy="56" rx="10" ry="6" fill={FUR_LIGHT} opacity="0.5" />
      </g>
      <ellipse cx="50" cy="73" rx="13" ry="14" fill={CREAM} />
      <ellipse cx="53" cy="77" rx="9" ry="9" fill={CREAM_SHADE} opacity="0.55" />
      <circle cx="50" cy="77" r="4.4" fill={BUTTON} />
      <circle cx="50" cy="77" r="3.1" fill="none" stroke={BUTTON_DARK} strokeWidth="0.8" />
      <path d="M48.4 75.4 L51.6 78.6 M51.6 75.4 L48.4 78.6" stroke={BUTTON_DARK} strokeWidth="1" strokeLinecap="round" />

      {/* long floppy arms */}
      {[
        { x: 27, r: 14 },
        { x: 73, r: -14 },
      ].map(({ x, r }) => (
        <g key={x} transform={`rotate(${r} ${x} 60)`}>
          <ellipse cx={x} cy="70" rx="7" ry="14" fill={FUR_DARK} />
          <ellipse cx={x} cy="69.4" rx="6.4" ry="13.4" fill={FUR} />
        </g>
      ))}

      {bandana}

      {/* ears */}
      {[28, 72].map((x) => (
        <g key={x}>
          <circle cx={x} cy="29" r="8.5" fill={FUR} />
          <circle cx={x} cy="29.4" r="5.2" fill={CREAM_SHADE} />
        </g>
      ))}

      {/* head with a few fluffy tufts */}
      <circle cx="50" cy="30" r="21" fill={FUR} />
      {[
        [41, 11.5, 4],
        [50, 9.6, 4.4],
        [59, 11.5, 4],
      ].map(([x, y, r]) => (
        <circle key={x} cx={x} cy={y} r={r} fill={FUR} />
      ))}
      <g clipPath={`url(#${uid}h)`}>
        <ellipse cx="66" cy="42" rx="14" ry="18" fill={FUR_DARK} opacity="0.3" />
      </g>
      <ellipse cx="40" cy="15" rx="6" ry="3" fill={FUR_LIGHT} opacity="0.7" transform="rotate(-20 40 15)" />

      {/* cream face with the big soft snout */}
      <path d={FACE} fill={CREAM} />
      <ellipse cx="56" cy="44" rx="10" ry="7" fill={CREAM_SHADE} opacity="0.5" />
      <ellipse cx="45" cy="36" rx="6" ry="3" fill="#fff" opacity="0.6" />

      {/* cheeks */}
      {(mood === 'happy' || mood === 'excited' || mood === 'love') && (
        <>
          <ellipse cx="37" cy="39" rx="3.4" ry="2" fill={PINK} opacity="0.6" />
          <ellipse cx="63" cy="39" rx="3.4" ry="2" fill={PINK} opacity="0.6" />
        </>
      )}

      {eyes()}
      {/* little nose */}
      <ellipse cx="50" cy="34.5" rx="2.6" ry="1.5" fill={CREAM_SHADE} />
      <circle cx="48.6" cy="34.6" r="0.6" fill="#a07a50" />
      <circle cx="51.4" cy="34.6" r="0.6" fill="#a07a50" />
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
