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

/** one rounded body: head and belly in a single egg shape */
const BODY = 'M50 10 C75 10 87 30 87 54 C87 78 73 92 50 92 C27 92 13 78 13 54 C13 30 25 10 50 10 Z'

function Heart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d="M0 3 C-1.7 -0.8 -7.4 -1 -7.4 3.3 C-7.4 6.8 -3.4 9.8 0 12.6 C3.4 9.8 7.4 6.8 7.4 3.3 C7.4 -1 1.7 -0.8 0 3 Z"
      fill="#ff4b4b"
      transform={`translate(${x} ${y - 6}) scale(${s})`}
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
          <circle cx={cx} cy="40" r="12.5" fill="#fff" />
          <Heart x={cx} y={41} s={1.05} />
        </g>
      )
    }
    if (mood === 'sleepy') {
      return (
        <g key={cx}>
          <circle cx={cx} cy="40" r="12.5" fill="#fff" />
          {/* heavy lid over the upper two thirds */}
          <path d={`M${cx - 13} 40 A13 13 0 0 1 ${cx + 13} 40 L${cx + 13} 43 Q${cx} 47 ${cx - 13} 43 Z`} fill={GREEN} />
          <path d={`M${cx - 9} 44.5 Q${cx} 48 ${cx + 9} 44.5`} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      )
    }
    const look = mood === 'sad' ? 3 : 1.5
    return (
      <g key={cx}>
        <circle cx={cx} cy="40" r="12.5" fill="#fff" />
        <circle cx={cx - side * 2.4} cy={40 + look} r={mood === 'excited' ? 7.4 : 6.8} fill={INK} />
        <circle cx={cx - side * 2.4 + 2.2} cy={40 + look - 2.6} r="2.3" fill="#fff" />
        {mood === 'sad' && (
          // lids slanting down to the outside, inner corners raised
          <path d={`M${cx - 13} ${side < 0 ? 36 : 30} L${cx + 13} ${side < 0 ? 30 : 36} L${cx + 13} 26 L${cx - 13} 26 Z`} fill={GREEN} />
        )}
      </g>
    )
  }

  const mouth = () => {
    switch (mood) {
      case 'sad':
        return <path d="M43 62 Q50 57.5 57 62" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      case 'excited':
        return (
          <g>
            <path d="M40 56 Q50 70 60 56 Z" fill={INK} />
            <path d="M44.5 61.5 Q50 58.6 55.5 61.5 Q50 66.6 44.5 61.5 Z" fill={PINK} />
          </g>
        )
      case 'sleepy':
        return <ellipse cx="50" cy="60" rx="2.6" ry="2" fill={INK} />
      case 'neutral':
        return <path d="M45 59 Q50 61 55 59" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      default:
        return <path d="M43 57.5 Q50 64.5 57 57.5" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />
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
        <clipPath id={`${uid}b`}>
          <path d={BODY} />
        </clipPath>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="50" cy="95" rx="30" ry="3.6" fill="#000" opacity="0.08" />

      {/* tail, curling out behind the body */}
      <path d="M78 80 C94 80 98 64 90 56 C85 51 79 55 82 60" stroke={GREEN_DARK} strokeWidth="10" fill="none" strokeLinecap="round" />

      {/* feet with round toe pads */}
      {[30, 70].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="90" rx="10" ry="5.5" fill={GREEN_DARK} />
          {[-6, 0, 6].map((d) => (
            <circle key={d} cx={x + d} cy="93" r="2.4" fill={GREEN_LIGHT} />
          ))}
        </g>
      ))}

      {/* body */}
      <path d={BODY} fill={GREEN} />
      <g clipPath={`url(#${uid}b)`}>
        {/* shading on the lower right, highlight on the upper left */}
        <ellipse cx="78" cy="78" rx="34" ry="30" fill={GREEN_DARK} opacity="0.55" />
        <ellipse cx="33" cy="22" rx="18" ry="10" fill="#fff" opacity="0.18" transform="rotate(-25 33 22)" />
        {/* belly */}
        <ellipse cx="50" cy="80" rx="20" ry="14.5" fill={BELLY} />
        <path d="M38 76.5 Q50 79 62 76.5 M40 83 Q50 85.5 60 83" stroke="#bfeea0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* gecko spots on the head */}
        <circle cx="50" cy="18" r="2.6" fill={GREEN_DARK} opacity="0.6" />
        <circle cx="41" cy="21" r="1.8" fill={GREEN_DARK} opacity="0.6" />
        <circle cx="59" cy="21" r="1.8" fill={GREEN_DARK} opacity="0.6" />
      </g>

      {/* little arms with sticky toe pads, resting on the belly */}
      {[
        { x: 22, r: 20 },
        { x: 78, r: -20 },
      ].map(({ x, r }) => (
        <g key={x} transform={`rotate(${r} ${x} 66)`}>
          <ellipse cx={x} cy="68" rx="6" ry="9" fill={GREEN_DARK} />
          {[-3.6, 0, 3.6].map((d) => (
            <circle key={d} cx={x + d} cy="76" r="2" fill={GREEN_LIGHT} />
          ))}
        </g>
      ))}

      {/* cheeks */}
      {(mood === 'happy' || mood === 'excited' || mood === 'love') && (
        <>
          <ellipse cx="25" cy="54" rx="5" ry="3" fill={PINK} opacity="0.5" />
          <ellipse cx="75" cy="54" rx="5" ry="3" fill={PINK} opacity="0.5" />
        </>
      )}

      {eye(36, -1)}
      {eye(64, 1)}
      {mouth()}

      {/* ---- accessories ---- */}

      {has('mascot-bandana') && (
        <g>
          <path d="M18 61 Q50 74 82 61 L80.5 68 Q50 81 19.5 68 Z" fill="#ff4b4b" />
          <path d="M40 72 L50 88 L60 72 Q50 75 40 72 Z" fill="#e53a3a" />
          {[
            [30, 67],
            [44, 72],
            [58, 71.6],
            [71, 66.6],
            [50, 80],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#fff" opacity="0.85" />
          ))}
          <circle cx="50" cy="73.5" r="3" fill="#d93636" />
        </g>
      )}

      {has('mascot-sunglasses') && (
        <g>
          <path d="M20 37 H80" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <rect x="22.5" y="31" width="27" height="19" rx="8" fill={INK} />
          <rect x="50.5" y="31" width="27" height="19" rx="8" fill={INK} />
          <path d="M27 36 L33 36 L28.5 44" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.35" />
          <path d="M55 36 L61 36 L56.5 44" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.35" />
        </g>
      )}

      {has('mascot-cap') && (
        <g>
          {/* dome sits on the top of the head, bill points to the viewer */}
          <path d="M24 26 C24 5 76 5 76 26 Z" fill="#1cb0f6" />
          <path d="M50 7 C64 7 76 13 76 26 L60 26 C60 15 56 8 50 7 Z" fill="#1899d6" />
          <path d="M50 6.5 V26" stroke="#1480b3" strokeWidth="1.4" />
          <ellipse cx="50" cy="27.5" rx="32" ry="5.6" fill="#1480b3" />
          <ellipse cx="50" cy="26.4" rx="31" ry="4.2" fill="#1cb0f6" />
          <circle cx="50" cy="6" r="2.6" fill="#1480b3" />
          <path d="M33 12 Q38 9 43 8.4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
        </g>
      )}

      {has('mascot-crown') && (
        <g>
          <path d="M30 22 L28 6 L39.5 14 L50 2 L60.5 14 L72 6 L70 22 Q50 18 30 22 Z" fill="#ffc800" />
          <path d="M30 22 Q50 18 70 22 L70 26 Q50 22 30 26 Z" fill="#e5a400" />
          <circle cx="50" cy="15" r="2.8" fill="#ff4b4b" />
          <circle cx="38.5" cy="18" r="2" fill="#1cb0f6" />
          <circle cx="61.5" cy="18" r="2" fill="#1cb0f6" />
          <circle cx="28" cy="6" r="1.8" fill="#ffc800" />
          <circle cx="50" cy="2" r="1.8" fill="#ffc800" />
          <circle cx="72" cy="6" r="1.8" fill="#ffc800" />
          <path d="M33 9.5 L34 18" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        </g>
      )}
    </svg>
  )
}
