import { useId } from 'react'

export type MascotMood = 'happy' | 'excited' | 'sad' | 'neutral' | 'sleepy' | 'love'

interface Props {
  mood?: MascotMood
  size?: number
  accessories?: string[]
  className?: string
  bounce?: boolean
}

/* flat, friendly colours – no outlines, shading is done with darker shapes */
const GREEN = '#58cc02'
const GREEN_DARK = '#46a302'
const GREEN_LIGHT = '#89e219'
const BELLY = '#d7ffb8'
const INK = '#1f2a24'
const PINK = '#ff86b0'

/** eye centres and radius on the head */
const EYE_Y = 31
const EYE_R = 9.5

function Heart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d="M0 3 C-1.7 -0.8 -7.4 -1 -7.4 3.3 C-7.4 6.8 -3.4 9.8 0 12.6 C3.4 9.8 7.4 6.8 7.4 3.3 C7.4 -1 1.7 -0.8 0 3 Z"
      fill="#ff4b4b"
      transform={`translate(${x} ${y - 5}) scale(${s})`}
    />
  )
}

/** Flowy the gecko – the app's mascot (10 sticky toes = perfect for typing!) */
export default function Mascot({ mood = 'happy', size = 96, accessories = [], className = '', bounce = false }: Props) {
  const uid = useId().replace(/:/g, '')
  const has = (id: string) => accessories.includes(id)

  const eye = (cx: number, side: -1 | 1) => {
    if (mood === 'love') {
      return (
        <g key={cx}>
          <circle cx={cx} cy={EYE_Y} r={EYE_R} fill="#fff" />
          <Heart x={cx} y={EYE_Y + 1} s={0.8} />
        </g>
      )
    }
    if (mood === 'sleepy') {
      return (
        <g key={cx}>
          <circle cx={cx} cy={EYE_Y} r={EYE_R} fill="#fff" />
          <path d={`M${cx - EYE_R - 0.5} ${EYE_Y} A${EYE_R + 0.5} ${EYE_R + 0.5} 0 0 1 ${cx + EYE_R + 0.5} ${EYE_Y} L${cx + EYE_R + 0.5} ${EYE_Y + 2} Q${cx} ${EYE_Y + 5} ${cx - EYE_R - 0.5} ${EYE_Y + 2} Z`} fill={GREEN} />
          <path d={`M${cx - 6.5} ${EYE_Y + 3.4} Q${cx} ${EYE_Y + 6} ${cx + 6.5} ${EYE_Y + 3.4}`} stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )
    }
    const look = mood === 'sad' ? 2.2 : 1
    return (
      <g key={cx}>
        <circle cx={cx} cy={EYE_Y} r={EYE_R} fill="#fff" />
        <circle cx={cx - side * 1.6} cy={EYE_Y + look} r={mood === 'excited' ? 5.6 : 5.1} fill={INK} />
        <circle cx={cx - side * 1.6 + 1.7} cy={EYE_Y + look - 2} r="1.8" fill="#fff" />
        {mood === 'sad' && (
          // lids slanting down to the outside, inner corners raised
          <path d={`M${cx - 10} ${EYE_Y + (side < 0 ? -3 : -7.5)} L${cx + 10} ${EYE_Y + (side < 0 ? -7.5 : -3)} L${cx + 10} ${EYE_Y - 11} L${cx - 10} ${EYE_Y - 11} Z`} fill={GREEN} />
        )}
      </g>
    )
  }

  const mouth = () => {
    switch (mood) {
      case 'sad':
        return <path d="M45 47 Q50 43.6 55 47" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      case 'excited':
        return (
          <g>
            <path d="M42.5 42.5 Q50 53.5 57.5 42.5 Z" fill={INK} />
            <path d="M46 47 Q50 45 54 47 Q50 50.6 46 47 Z" fill={PINK} />
          </g>
        )
      case 'sleepy':
        return <ellipse cx="50" cy="46" rx="2" ry="1.6" fill={INK} />
      case 'neutral':
        return <path d="M46 45.5 Q50 47 54 45.5" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      default:
        return <path d="M44.5 43.5 Q50 49 55.5 43.5" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
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
      aria-label="Flowy, der Gecko"
    >
      <defs>
        <clipPath id={`${uid}h`}>
          <ellipse cx="50" cy="33" rx="26" ry="20" />
        </clipPath>
        <clipPath id={`${uid}t`}>
          <ellipse cx="50" cy="70" rx="14.5" ry="18" />
        </clipPath>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="54" cy="95" rx="30" ry="3" fill="#000" opacity="0.08" />

      {/* long curly tail behind the body */}
      <path d="M58 84 C72 93 90 88 91 75 C92 66 84 62 80 67 C77 71 82 75 85 72" stroke={GREEN_DARK} strokeWidth="6.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* legs (sitting) with round toe pads */}
      {[
        { x: 38, s: -1 },
        { x: 62, s: 1 },
      ].map(({ x, s }) => (
        <g key={x}>
          <ellipse cx={x} cy="84" rx="7" ry="6" fill={GREEN_DARK} />
          <ellipse cx={x + s * 2} cy="91" rx="7.5" ry="3.4" fill={GREEN_DARK} />
          {[-4.5, 0, 4.5].map((d) => (
            <circle key={d} cx={x + s * 2 + d} cy="93.2" r="1.9" fill={GREEN_LIGHT} />
          ))}
        </g>
      ))}

      {/* torso */}
      <ellipse cx="50" cy="70" rx="14.5" ry="18" fill={GREEN} />
      <g clipPath={`url(#${uid}t)`}>
        <ellipse cx="62" cy="78" rx="12" ry="20" fill={GREEN_DARK} opacity="0.45" />
        <ellipse cx="50" cy="73" rx="8.5" ry="13" fill={BELLY} />
        <path d="M44 68 Q50 70 56 68 M44.5 74 Q50 76 55.5 74 M45.5 80 Q50 82 54.5 80" stroke="#bfeea0" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>

      {/* arms with sticky fingers */}
      {[
        { x: 36, s: -1 },
        { x: 64, s: 1 },
      ].map(({ x, s }) => (
        <g key={x}>
          <path d={`M${x + s * -1} 60 Q${x + s * 6} 68 ${x + s * 3} 76`} stroke={GREEN} strokeWidth="6" fill="none" strokeLinecap="round" />
          {[-2.6, 0, 2.6].map((d) => (
            <circle key={d} cx={x + s * 3 + d} cy="79" r="1.7" fill={GREEN_LIGHT} />
          ))}
        </g>
      ))}

      {/* head */}
      <ellipse cx="50" cy="33" rx="26" ry="20" fill={GREEN} />
      <g clipPath={`url(#${uid}h)`}>
        <ellipse cx="66" cy="48" rx="30" ry="14" fill={GREEN_DARK} opacity="0.4" />
        <ellipse cx="36" cy="19" rx="11" ry="5.5" fill="#fff" opacity="0.2" transform="rotate(-18 36 19)" />
      </g>
      {/* gecko spots */}
      <circle cx="50" cy="17" r="2.2" fill={GREEN_DARK} opacity="0.7" />
      <circle cx="43" cy="19" r="1.5" fill={GREEN_DARK} opacity="0.7" />
      <circle cx="57" cy="19" r="1.5" fill={GREEN_DARK} opacity="0.7" />
      <circle cx="50" cy="58" r="1.6" fill={GREEN_DARK} opacity="0.6" />
      {/* nostrils */}
      <circle cx="47.6" cy="39.6" r="0.8" fill={GREEN_DARK} />
      <circle cx="52.4" cy="39.6" r="0.8" fill={GREEN_DARK} />

      {/* cheeks */}
      {(mood === 'happy' || mood === 'excited' || mood === 'love') && (
        <>
          <ellipse cx="28" cy="41" rx="4" ry="2.4" fill={PINK} opacity="0.55" />
          <ellipse cx="72" cy="41" rx="4" ry="2.4" fill={PINK} opacity="0.55" />
        </>
      )}

      {eye(38, -1)}
      {eye(62, 1)}
      {mouth()}

      {/* ---- accessories ---- */}

      {has('mascot-bandana') && (
        <g>
          <path d="M34 50.5 Q50 58 66 50.5 L65 56.5 Q50 64.5 35 56.5 Z" fill="#ff4b4b" />
          <path d="M42.5 58.5 L50 71 L57.5 58.5 Q50 61.5 42.5 58.5 Z" fill="#e53a3a" />
          {[
            [39, 55.5],
            [46, 58.3],
            [54, 58.3],
            [61, 55.5],
            [50, 65],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#fff" opacity="0.85" />
          ))}
          <circle cx="50" cy="59.5" r="2.4" fill="#d93636" />
        </g>
      )}

      {has('mascot-sunglasses') && (
        <g>
          <path d="M23 28.5 H77" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <rect x="27" y="23.5" width="22" height="15" rx="6.5" fill={INK} />
          <rect x="51" y="23.5" width="22" height="15" rx="6.5" fill={INK} />
          <path d="M30.5 27.5 L35 27.5 L31.5 34" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.35" />
          <path d="M54.5 27.5 L59 27.5 L55.5 34" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.35" />
        </g>
      )}

      {has('mascot-cap') && (
        <g>
          <path d="M27 20 C27 1 73 1 73 20 Z" fill="#1cb0f6" />
          <path d="M50 3 C62 3 73 8.5 73 20 L59 20 C59 10 55.5 4 50 3 Z" fill="#1899d6" />
          <path d="M50 2.5 V20" stroke="#1480b3" strokeWidth="1.2" />
          <ellipse cx="50" cy="21.2" rx="28" ry="4.8" fill="#1480b3" />
          <ellipse cx="50" cy="20.3" rx="27" ry="3.6" fill="#1cb0f6" />
          <circle cx="50" cy="2.2" r="2.2" fill="#1480b3" />
          <path d="M34 8 Q38.5 5.2 43 4.6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.4" />
        </g>
      )}

      {has('mascot-crown') && (
        <g>
          <path d="M33 16 L31 2 L41 8.5 L50 -1 L59 8.5 L69 2 L67 16 Q50 12.5 33 16 Z" fill="#ffc800" />
          <path d="M33 16 Q50 12.5 67 16 L67 19.5 Q50 16 33 19.5 Z" fill="#e5a400" />
          <circle cx="50" cy="10" r="2.4" fill="#ff4b4b" />
          <circle cx="40.5" cy="12.6" r="1.7" fill="#1cb0f6" />
          <circle cx="59.5" cy="12.6" r="1.7" fill="#1cb0f6" />
          <circle cx="31" cy="2" r="1.6" fill="#ffc800" />
          <circle cx="50" cy="-1" r="1.6" fill="#ffc800" />
          <circle cx="69" cy="2" r="1.6" fill="#ffc800" />
        </g>
      )}
    </svg>
  )
}
