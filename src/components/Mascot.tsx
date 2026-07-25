export type MascotMood = 'happy' | 'excited' | 'sad' | 'neutral' | 'sleepy' | 'love'

interface Props {
  mood?: MascotMood
  size?: number
  accessories?: string[]
  className?: string
  bounce?: boolean
}

const INK = '#0b1220'
const OUTLINE = '#14532d'

function Heart({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <path
      d="M0,2.6 C-1.6,-0.6 -6.4,-0.9 -6.4,2.8 C-6.4,5.9 -3,8.6 0,11.2 C3,8.6 6.4,5.9 6.4,2.8 C6.4,-0.9 1.6,-0.6 0,2.6 Z"
      fill="#f43f5e"
      stroke={OUTLINE}
      strokeWidth="0.8"
      strokeLinejoin="round"
      transform={`translate(${x} ${y}) scale(${scale})`}
    />
  )
}

/** Flowy the gecko - original mascot for the app (10 sticky fingers/toes = perfect for typing!) */
export default function Mascot({ mood = 'happy', size = 96, accessories = [], className = '', bounce = false }: Props) {
  const eyes = () => {
    switch (mood) {
      case 'sad':
        return (
          <g stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round">
            <path d="M32 43 Q38 37 44 43" />
            <path d="M56 43 Q62 37 68 43" />
          </g>
        )
      case 'sleepy':
        return <path d="M31 44 Q38 47 45 44 M55 44 Q62 47 69 44" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      case 'love':
        return (
          <>
            <Heart x={38} y={38} scale={1.05} />
            <Heart x={62} y={38} scale={1.05} />
          </>
        )
      default:
        return (
          <>
            <circle cx="38" cy="43" r="6.4" fill={INK} />
            <circle cx="62" cy="43" r="6.4" fill={INK} />
            <circle cx="40.3" cy="40.6" r="2" fill="#fff" />
            <circle cx="64.3" cy="40.6" r="2" fill="#fff" />
          </>
        )
    }
  }

  const mouth = () => {
    switch (mood) {
      case 'sad':
        return <path d="M38 61 Q50 54 62 61" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      case 'excited':
        return <path d="M35 56 Q50 76 65 56 Q50 66 35 56 Z" fill={INK} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
      case 'sleepy':
        return <ellipse cx="50" cy="58" rx="3.5" ry="2.6" fill={INK} />
      default:
        return <path d="M36 56 Q50 67 64 56" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${bounce ? 'animate-bounce' : ''}`}
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))' }}
    >
      {/* tail (outline drawn first as a thicker underlay so it reads as a stroke) */}
      <path d="M77 68 Q96 65 91 46 Q89 36 78 39" stroke={OUTLINE} strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M77 68 Q96 65 91 46 Q89 36 78 39" stroke="#16a34a" strokeWidth="10" fill="none" strokeLinecap="round" />

      {/* legs (behind body) */}
      <ellipse cx="23" cy="85" rx="7.5" ry="5.5" fill="#16a34a" stroke={OUTLINE} strokeWidth="1.6" />
      <ellipse cx="77" cy="85" rx="7.5" ry="5.5" fill="#16a34a" stroke={OUTLINE} strokeWidth="1.6" />

      {/* body */}
      <ellipse cx="50" cy="71" rx="29" ry="21" fill="#22c55e" stroke={OUTLINE} strokeWidth="2" />
      {/* belly */}
      <ellipse cx="50" cy="77" rx="17.5" ry="11.5" fill="#bbf7d0" />

      {/* head */}
      <circle cx="50" cy="43" r="27" fill="#34d399" stroke={OUTLINE} strokeWidth="2" />
      {/* head shine */}
      <ellipse cx="40" cy="32" rx="9" ry="6" fill="#ffffff" opacity="0.25" />
      {/* head spots */}
      <circle cx="27" cy="38" r="2.6" fill="#16a34a" opacity="0.55" />
      <circle cx="73" cy="36" r="2.2" fill="#16a34a" opacity="0.55" />

      {/* cheeks */}
      {(mood === 'happy' || mood === 'excited' || mood === 'love') && (
        <>
          <ellipse cx="30" cy="52" rx="5" ry="3.2" fill="#f472b6" opacity="0.45" />
          <ellipse cx="70" cy="52" rx="5" ry="3.2" fill="#f472b6" opacity="0.45" />
        </>
      )}

      {eyes()}
      {mouth()}

      {/* ---- accessories ---- */}

      {accessories.includes('mascot-cap') && (
        <g strokeLinejoin="round">
          {/* brim, sticking out to the front-right for a 3/4 view */}
          <path
            d="M66 29 Q85 27 89 37 Q88 40 84 40 Q73 35 64 34 Z"
            fill="#b91c1c"
            stroke={OUTLINE}
            strokeWidth="1.8"
          />
          {/* dome, following the head's curvature so it sits flush */}
          <path
            d="M22 32 Q50 2 78 32 Q65 21 50 21 Q35 21 22 32 Z"
            fill="#ef4444"
            stroke={OUTLINE}
            strokeWidth="2.2"
          />
          {/* front panel seam for a classic ball-cap look */}
          <path d="M50 21 L50 5" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M22 32 Q50 21 78 32" stroke={OUTLINE} strokeWidth="1.6" fill="none" />
          <path d="M46 6 Q34 13 26 29" stroke="#fca5a5" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.75" />
          <circle cx="50" cy="5" r="2.8" fill="#b91c1c" stroke={OUTLINE} strokeWidth="1.4" />
        </g>
      )}

      {accessories.includes('mascot-sunglasses') && (
        <g stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M30 44 Q30 37 38 37 Q46 37 46 44 Q46 51 38 51 Q30 51 30 44 Z" fill="#0b1220" />
          <path d="M54 44 Q54 37 62 37 Q70 37 70 44 Q70 51 62 51 Q54 51 54 44 Z" fill="#0b1220" />
          <path d="M46 41 Q50 38 54 41" fill="none" strokeLinecap="round" />
          <path d="M23 40 Q27 38 30 40" fill="none" strokeLinecap="round" />
          <path d="M70 40 Q73 38 77 40" fill="none" strokeLinecap="round" />
          <path d="M34 40 Q37 39 40 40.5" stroke="#7dd3fc" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M58 40 Q61 39 64 40.5" stroke="#7dd3fc" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85" />
        </g>
      )}

      {accessories.includes('mascot-crown') && (
        <g stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round">
          <path
            d="M26 30 L32 15 L42 25 L50 12 L58 25 L68 15 L74 30 Q50 24 26 30 Z"
            fill="#facc15"
          />
          <circle cx="50" cy="21" r="2.6" fill="#ef4444" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="38" cy="24" r="2" fill="#38bdf8" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="62" cy="24" r="2" fill="#38bdf8" stroke={OUTLINE} strokeWidth="1" />
        </g>
      )}

      {accessories.includes('mascot-bandana') && (
        <g stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round">
          <path d="M25 60 Q50 71 75 60 L69 79 Q50 88 31 79 Z" fill="#f43f5e" />
          <path d="M43 66 L50 84 L57 66" fill="#e11d48" stroke="none" opacity="0.6" />
          <circle cx="50" cy="68" r="3.4" fill="#fda4af" stroke={OUTLINE} strokeWidth="1.2" />
        </g>
      )}
    </svg>
  )
}
