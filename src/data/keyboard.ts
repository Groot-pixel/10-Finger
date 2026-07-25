// QWERTZ (German) keyboard layout with 10-finger-system finger assignment.

export type FingerId =
  | 'L-pinky' | 'L-ring' | 'L-middle' | 'L-index' | 'L-thumb'
  | 'R-thumb' | 'R-index' | 'R-middle' | 'R-ring' | 'R-pinky'

export interface KeyDef {
  /** lowercase character produced without shift */
  base: string
  /** character produced with shift, if any */
  shift?: string
  finger: FingerId
  /** relative width in keycap units */
  width?: number
}

export const FINGER_LABEL: Record<FingerId, string> = {
  'L-pinky': 'Linker kleiner Finger',
  'L-ring': 'Linker Ringfinger',
  'L-middle': 'Linker Mittelfinger',
  'L-index': 'Linker Zeigefinger',
  'L-thumb': 'Linker Daumen',
  'R-thumb': 'Rechter Daumen',
  'R-index': 'Rechter Zeigefinger',
  'R-middle': 'Rechter Mittelfinger',
  'R-ring': 'Rechter Ringfinger',
  'R-pinky': 'Rechter kleiner Finger',
}

// Vibrant, distinguishable colors per finger (used for keycaps + hand chart)
export const FINGER_COLOR: Record<FingerId, string> = {
  'L-pinky': '#f43f5e',
  'L-ring': '#fb923c',
  'L-middle': '#facc15',
  'L-index': '#4ade80',
  'L-thumb': '#94a3b8',
  'R-thumb': '#94a3b8',
  'R-index': '#22d3ee',
  'R-middle': '#818cf8',
  'R-ring': '#c084fc',
  'R-pinky': '#f472b6',
}

export const KEY_ROWS: KeyDef[][] = [
  [
    { base: '^', shift: '°', finger: 'L-pinky' },
    { base: '1', shift: '!', finger: 'L-pinky' },
    { base: '2', shift: '"', finger: 'L-ring' },
    { base: '3', shift: '§', finger: 'L-middle' },
    { base: '4', shift: '$', finger: 'L-index' },
    { base: '5', shift: '%', finger: 'L-index' },
    { base: '6', shift: '&', finger: 'R-index' },
    { base: '7', shift: '/', finger: 'R-index' },
    { base: '8', shift: '(', finger: 'R-middle' },
    { base: '9', shift: ')', finger: 'R-ring' },
    { base: '0', shift: '=', finger: 'R-pinky' },
    { base: 'ß', shift: '?', finger: 'R-pinky' },
  ],
  [
    { base: 'q', shift: 'Q', finger: 'L-pinky' },
    { base: 'w', shift: 'W', finger: 'L-ring' },
    { base: 'e', shift: 'E', finger: 'L-middle' },
    { base: 'r', shift: 'R', finger: 'L-index' },
    { base: 't', shift: 'T', finger: 'L-index' },
    { base: 'z', shift: 'Z', finger: 'R-index' },
    { base: 'u', shift: 'U', finger: 'R-index' },
    { base: 'i', shift: 'I', finger: 'R-middle' },
    { base: 'o', shift: 'O', finger: 'R-ring' },
    { base: 'p', shift: 'P', finger: 'R-pinky' },
    { base: 'ü', shift: 'Ü', finger: 'R-pinky' },
  ],
  [
    { base: 'a', shift: 'A', finger: 'L-pinky' },
    { base: 's', shift: 'S', finger: 'L-ring' },
    { base: 'd', shift: 'D', finger: 'L-middle' },
    { base: 'f', shift: 'F', finger: 'L-index' },
    { base: 'g', shift: 'G', finger: 'L-index' },
    { base: 'h', shift: 'H', finger: 'R-index' },
    { base: 'j', shift: 'J', finger: 'R-index' },
    { base: 'k', shift: 'K', finger: 'R-middle' },
    { base: 'l', shift: 'L', finger: 'R-ring' },
    { base: 'ö', shift: 'Ö', finger: 'R-pinky' },
    { base: 'ä', shift: 'Ä', finger: 'R-pinky' },
  ],
  [
    { base: 'y', shift: 'Y', finger: 'L-pinky' },
    { base: 'x', shift: 'X', finger: 'L-ring' },
    { base: 'c', shift: 'C', finger: 'L-middle' },
    { base: 'v', shift: 'V', finger: 'L-index' },
    { base: 'b', shift: 'B', finger: 'L-index' },
    { base: 'n', shift: 'N', finger: 'R-index' },
    { base: 'm', shift: 'M', finger: 'R-index' },
    { base: ',', shift: ';', finger: 'R-middle' },
    { base: '.', shift: ':', finger: 'R-ring' },
    { base: '-', shift: '_', finger: 'R-pinky' },
  ],
]

/** character -> finger, includes both base and shifted glyphs */
export const CHAR_FINGER_MAP: Record<string, FingerId> = (() => {
  const map: Record<string, FingerId> = {}
  for (const row of KEY_ROWS) {
    for (const k of row) {
      map[k.base] = k.finger
      if (k.shift) map[k.shift] = k.finger
    }
  }
  map[' '] = 'L-thumb'
  return map
})()

export function fingerFor(char: string): FingerId {
  return CHAR_FINGER_MAP[char] ?? CHAR_FINGER_MAP[char.toLowerCase()] ?? 'R-index'
}

export function isShifted(char: string): boolean {
  if (char === ' ') return false
  for (const row of KEY_ROWS) {
    for (const k of row) {
      if (k.shift === char) return true
    }
  }
  return false
}

export const HAND_OF: Record<FingerId, 'L' | 'R'> = {
  'L-pinky': 'L', 'L-ring': 'L', 'L-middle': 'L', 'L-index': 'L', 'L-thumb': 'L',
  'R-thumb': 'R', 'R-index': 'R', 'R-middle': 'R', 'R-ring': 'R', 'R-pinky': 'R',
}
