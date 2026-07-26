import { useEffect, useRef, useState } from 'react'
import type { Point } from './useKeyRects'

/** smoothly glides toward a moving target point (used for the "reaching finger" animation) */
export function useAnimatedPoint(target: Point | undefined, durationMs = 150): Point | undefined {
  const [pos, setPos] = useState<Point | undefined>(target)
  const fromRef = useRef<Point | undefined>(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!target) return
    const from = fromRef.current ?? target
    if (from.x === target.x && from.y === target.y) return

    const start = performance.now()
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setPos({ x: from.x + (target.x - from.x) * eased, y: from.y + (target.y - from.y) * eased })
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.x, target?.y, durationMs])

  return pos
}
