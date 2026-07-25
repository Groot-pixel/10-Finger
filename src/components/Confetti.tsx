import { useMemo } from 'react'

const COLORS = ['#22c55e', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6', '#f43f5e', '#facc15']

export default function Confetti({ pieces = 80 }: { pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.2 + Math.random() * 1.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 120,
      })),
    [pieces],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      {items.map((c) => (
        <span
          key={c.id}
          className="absolute top-[-5%] block confetti-piece"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.4,
            background: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            transform: `rotate(${c.rotate}deg)`,
            // @ts-expect-error custom property for drift
            '--drift': `${c.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
