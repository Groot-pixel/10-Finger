/** mixes a hex colour with white (t > 0) or black (t < 0) */
export function shade(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = n >> 16
  const g = (n >> 8) & 255
  const b = n & 255
  const f = (c: number) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t))
  return `#${((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1)}`
}
