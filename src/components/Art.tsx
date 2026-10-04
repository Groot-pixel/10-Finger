import { useId } from 'react'
import { LEAGUES } from '../data/league'
import Icon from './Icon'
import { shade } from '../utils/color'

/* ------------------------------------------------------------------ */
/* League crest: a shield in the league colour with a cut gem inside   */
/* ------------------------------------------------------------------ */
export function LeagueBadge({ index, size = 48, locked = false }: { index: number; size?: number; locked?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const league = LEAGUES[Math.max(0, Math.min(LEAGUES.length - 1, index))]
  const base = locked ? '#b8c0c4' : league.color
  const light = shade(base, 0.45)
  const dark = shade(base, -0.28)
  // the first three leagues are classic medals (star), the others gem leagues
  const isMedal = index < 3
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 48 53" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={base} />
        </linearGradient>
      </defs>
      <path d="M24 2 44 9v15c0 13-8.6 22.4-20 27C12.6 46.4 4 37 4 24V9z" fill={dark} />
      <path d="M24 2 44 9v15c0 13-8.6 22.4-20 27C12.6 46.4 4 37 4 24V9z" fill={`url(#${uid}g)`} transform="translate(0 -1.6)" />
      <path d="M24 7.4 39 12.6v11.6c0 10-6.4 17.4-15 21.2-8.6-3.8-15-11.2-15-21.2V12.6z" fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth="1.6" />
      {isMedal ? (
        <path d="M24 13.6l3.1 6.4 7 .9-5.1 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7-5.1-4.9 7-.9z" fill="#fff" opacity={locked ? 0.7 : 0.95} />
      ) : (
        <g opacity={locked ? 0.7 : 1}>
          <path d="M17 15.6h14l5 6.2-12 14.6-12-14.6z" fill="#fff" />
          <path d="M12 21.8h24L24 36.4z" fill={light} opacity={0.6} />
          <path d="M20.4 21.8 24 36.4l3.6-14.6z" fill="#fff" opacity={0.8} />
        </g>
      )}
      <path d="M10 11.4 24 6.4v4L13 14.4z" fill="#fff" opacity={0.3} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Achievement badge: hexagon whose metal depends on the reached tier  */
/* ------------------------------------------------------------------ */
const TIER_METAL = ['#c9d1d5', '#d08a4b', '#b4c2cc', '#f5b400', '#7c5cff']

export function AchievementBadge({ icon, level, size = 64 }: { icon: string; level: number; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const metal = TIER_METAL[Math.min(level, TIER_METAL.length - 1)]
  const reached = level > 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="absolute inset-0">
        <defs>
          <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={shade(metal, 0.4)} />
            <stop offset="1" stopColor={shade(metal, -0.15)} />
          </linearGradient>
        </defs>
        <path d="M32 3.5 56.5 17.5v29L32 60.5 7.5 46.5v-29z" fill={shade(metal, -0.3)} />
        <path d="M32 2 56.5 16v29L32 59 7.5 45V16z" fill={`url(#${uid}m)`} />
        <path d="M32 9.6 50 20v21L32 51.4 14 41V20z" fill={reached ? '#fff' : 'var(--kb-key-bg)'} opacity={reached ? 0.92 : 1} />
        <path d="M32 2 56.5 16 52 18.6 32 7.2 12 18.6 7.5 16z" fill="#fff" opacity={0.35} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon name={icon} size={size * 0.44} muted={!reached} />
      </div>
      {reached && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[10px] font-extrabold text-white"
          style={{ background: shade(metal, -0.25), boxShadow: '0 1px 0 rgba(0,0,0,.15)' }}
        >
          {level}
        </span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Little avatar for league players: initials on a colourful circle    */
/* ------------------------------------------------------------------ */
const AVATAR_COLORS = ['#ff4b4b', '#ff9600', '#ffc800', '#58cc02', '#1cb0f6', '#ce82ff', '#ff86d0', '#14b8a6', '#6366f1']

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const color = AVATAR_COLORS[h % AVATAR_COLORS.length]
  const initials = name.replace(/[^A-ZÄÖÜa-zäöüß]/g, '').match(/[A-ZÄÖÜ]/g)?.slice(0, 2).join('') || name.slice(0, 2).toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(145deg, ${shade(color, 0.15)}, ${shade(color, -0.12)})`, boxShadow: `inset 0 -3px 0 ${shade(color, -0.3)}` }}
    >
      {initials}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Floating keycaps – decoration next to the learning path             */
/* ------------------------------------------------------------------ */
export function KeycapCluster({ keys, color, size = 120 }: { keys: string[]; color: string; size?: number }) {
  const caps = keys.slice(0, 3)
  while (caps.length < 3) caps.push(['F', 'J', '⇧'][caps.length])
  const spots = [
    { x: 8, y: 34, r: -12, s: 1 },
    { x: 56, y: 10, r: 10, s: 0.86 },
    { x: 60, y: 62, r: 4, s: 0.72 },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="112" rx="46" ry="5" fill={color} opacity={0.12} />
      {caps.map((k, i) => {
        const p = spots[i]
        return (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r} 26 26) scale(${p.s})`}>
            <rect x="0" y="6" width="52" height="50" rx="12" fill={shade(color, -0.25)} />
            <rect x="0" y="0" width="52" height="50" rx="12" fill={i === 0 ? color : 'var(--bg-elevated)'} stroke={i === 0 ? 'none' : 'var(--border)'} strokeWidth="2" />
            <rect x="7" y="5" width="38" height="34" rx="9" fill="#fff" opacity={i === 0 ? 0.18 : 0} />
            <text x="26" y="33" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="'Segoe UI', system-ui, sans-serif" fill={i === 0 ? '#fff' : color}>
              {k.toUpperCase()}
            </text>
          </g>
        )
      })}
      <path d="M100 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={color} opacity={0.6} />
      <circle cx="18" cy="16" r="3" fill={color} opacity={0.35} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Decorative pattern of tiny keycaps, used inside coloured banners    */
/* ------------------------------------------------------------------ */
export function BannerPattern({ opacity = 0.14 }: { opacity?: number }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id={`${uid}p`} width="54" height="54" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
          <rect x="6" y="6" width="18" height="16" rx="4" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="40" cy="36" r="3" fill="#fff" />
          <path d="M34 10l2 4 4 1-4 1-2 4-2-4-4-1 4-1z" fill="#fff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid}p)`} opacity={opacity} />
    </svg>
  )
}
