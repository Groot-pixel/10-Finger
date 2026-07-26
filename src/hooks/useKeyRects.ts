import { useEffect, useRef, useState, type RefObject } from 'react'

export interface Point {
  x: number
  y: number
}

/**
 * Measures the center point of every descendant with a `data-key` attribute,
 * relative to the given container. Re-measures on resize/layout changes so
 * the positions always match the actually-rendered (responsive) keyboard.
 */
export function useKeyRects(containerRef: RefObject<HTMLElement | null>): Map<string, Point> {
  const [rects, setRects] = useState<Map<string, Point>>(new Map())
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const containerRect = el.getBoundingClientRect()
      const map = new Map<string, Point>()
      el.querySelectorAll<HTMLElement>('[data-key]').forEach((node) => {
        const key = node.dataset.key
        if (key === undefined) return
        const r = node.getBoundingClientRect()
        map.set(key, {
          x: r.left - containerRect.left + r.width / 2,
          y: r.top - containerRect.top + r.height / 2,
        })
      })
      setRects(map)
    }

    const scheduleMeasure = () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(measure)
    }

    scheduleMeasure()
    const ro = new ResizeObserver(scheduleMeasure)
    ro.observe(el)
    window.addEventListener('resize', scheduleMeasure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', scheduleMeasure)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [containerRef])

  return rects
}
