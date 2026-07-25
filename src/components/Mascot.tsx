export type MascotMood = 'happy' | 'excited' | 'sad' | 'neutral' | 'sleepy' | 'love'

interface Props {
  mood?: MascotMood
  size?: number
  accessories?: string[]
  className?: string
  bounce?: boolean
}

/** Flowy the gecko - original mascot for the app (10 sticky fingers/toes = perfect for typing!) */
export default function Mascot({ mood = 'happy', size = 96, accessories = [], className = '', bounce = false }: Props) {
  const eyes = () => {
    switch (mood) {
      case 'sad':
        return <path d="M32 46 Q37 41 42 46 M58 46 Q63 41 68 46" stroke="#123" strokeWidth="3" fill="none" strokeLinecap="round" />
      case 'sleepy':
        return <path d="M31 46 h12 M57 46 h12" stroke="#123" strokeWidth="3" strokeLinecap="round" />
      case 'love':
        return (
          <>
            <path d="M37 41 l3 3 5-5" stroke="#123" strokeWidth="0" fill="none" />
            <text x="30" y="52" fontSize="16">💚</text>
            <text x="56" y="52" fontSize="16">💚</text>
          </>
        )
      default:
        return (
          <>
            <circle cx="37" cy="45" r="6" fill="#0b1220" />
            <circle cx="63" cy="45" r="6" fill="#0b1220" />
            <circle cx="39.2" cy="42.7" r="1.8" fill="#fff" />
            <circle cx="65.2" cy="42.7" r="1.8" fill="#fff" />
          </>
        )
    }
  }

  const mouth = () => {
    switch (mood) {
      case 'sad':
        return <path d="M38 63 Q50 55 62 63" stroke="#123" strokeWidth="3" fill="none" strokeLinecap="round" />
      case 'excited':
        return <path d="M36 58 Q50 74 64 58 Q50 68 36 58 Z" fill="#123" />
      case 'sleepy':
        return <ellipse cx="50" cy="60" rx="4" ry="3" fill="#123" />
      default:
        return <path d="M37 58 Q50 68 63 58" stroke="#123" strokeWidth="3" fill="none" strokeLinecap="round" />
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${bounce ? 'animate-bounce' : ''}`}
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}
    >
      {/* tail */}
      <path d="M78 70 Q95 68 92 50 Q90 40 80 42" stroke="#16a34a" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="50" cy="72" rx="30" ry="22" fill="#22c55e" />
      {/* belly */}
      <ellipse cx="50" cy="78" rx="18" ry="12" fill="#bbf7d0" />
      {/* legs */}
      <ellipse cx="24" cy="86" rx="7" ry="5" fill="#16a34a" />
      <ellipse cx="76" cy="86" rx="7" ry="5" fill="#16a34a" />
      {/* head */}
      <circle cx="50" cy="46" r="30" fill="#34d399" />
      {/* head spots */}
      <circle cx="30" cy="30" r="3" fill="#16a34a" opacity="0.6" />
      <circle cx="70" cy="28" r="2.5" fill="#16a34a" opacity="0.6" />
      {eyes()}
      {mouth()}

      {accessories.includes('mascot-cap') && (
        <path d="M22 24 Q50 -2 78 24 Q78 16 50 12 Q22 16 22 24 Z" fill="#ef4444" />
      )}
      {accessories.includes('mascot-sunglasses') && (
        <g>
          <rect x="27" y="39" width="18" height="10" rx="4" fill="#0b1220" />
          <rect x="55" y="39" width="18" height="10" rx="4" fill="#0b1220" />
          <rect x="45" y="42" width="10" height="3" fill="#0b1220" />
        </g>
      )}
      {accessories.includes('mascot-crown') && (
        <path d="M28 16 L34 28 L44 14 L50 28 L56 14 L66 28 L72 16 L70 32 L30 32 Z" fill="#facc15" stroke="#eab308" strokeWidth="1" />
      )}
    </svg>
  )
}
