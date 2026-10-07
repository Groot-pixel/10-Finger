export type LessonType = 'drill' | 'words' | 'sentences' | 'numbers' | 'punctuation' | 'checkpoint' | 'boss'

export interface LessonDef {
  id: string
  title: string
  type: LessonType
  /** newly introduced keys for this lesson (subset of unit's key pool) */
  newKeys: string[]
  icon: string
  /** base target character count at crown level 0 */
  baseLength: number
}

export interface UnitDef {
  id: string
  title: string
  subtitle: string
  color: string
  icon: string
  /** all characters that become available cumulatively once this unit is unlocked */
  keys: string[]
  lessons: LessonDef[]
}

export const CURRICULUM: UnitDef[] = [
  {
    id: 'u1',
    title: 'Grundreihe I',
    subtitle: 'Zeigefinger & Mittelfinger',
    color: '#22c55e',
    icon: 'keyboard',
    keys: ['f', 'j', 'd', 'k'],
    lessons: [
      { id: 'u1l1', title: 'F & J', type: 'drill', newKeys: ['f', 'j'], icon: 'keyboard', baseLength: 60 },
      { id: 'u1l2', title: 'D & K', type: 'drill', newKeys: ['d', 'k'], icon: 'keyboard', baseLength: 60 },
      { id: 'u1l3', title: 'Kombinieren', type: 'drill', newKeys: [], icon: 'abc', baseLength: 80 },
      { id: 'u1l4', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 100 },
    ],
  },
  {
    id: 'u2',
    title: 'Grundreihe II',
    subtitle: 'Ringfinger & kleiner Finger',
    color: '#16a34a',
    icon: 'dumbbell',
    keys: ['s', 'l', 'a', 'ö', 'g', 'h'],
    lessons: [
      { id: 'u2l1', title: 'S & L', type: 'drill', newKeys: ['s', 'l'], icon: 'keyboard', baseLength: 70 },
      { id: 'u2l2', title: 'A & Ö', type: 'drill', newKeys: ['a', 'ö'], icon: 'keyboard', baseLength: 70 },
      { id: 'u2l3', title: 'G & H', type: 'drill', newKeys: ['g', 'h'], icon: 'keyboard', baseLength: 70 },
      { id: 'u2l4', title: 'Grundreihe komplett', type: 'words', newKeys: [], icon: 'book', baseLength: 90 },
      { id: 'u2l5', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 110 },
    ],
  },
  {
    id: 'u3',
    title: 'Obere Reihe I',
    subtitle: 'Zeige- & Mittelfinger nach oben',
    color: '#0ea5e9',
    icon: 'rocket',
    keys: ['e', 'i', 'r', 'u'],
    lessons: [
      { id: 'u3l1', title: 'E & I', type: 'drill', newKeys: ['e', 'i'], icon: 'keyboard', baseLength: 70 },
      { id: 'u3l2', title: 'R & U', type: 'drill', newKeys: ['r', 'u'], icon: 'keyboard', baseLength: 70 },
      { id: 'u3l3', title: 'Erste Wörter', type: 'words', newKeys: [], icon: 'book', baseLength: 90 },
      { id: 'u3l4', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 110 },
    ],
  },
  {
    id: 'u4',
    title: 'Obere Reihe II',
    subtitle: 'Die Reihe wird komplett',
    color: '#0284c7',
    icon: 'map',
    keys: ['t', 'z', 'w', 'o', 'q', 'p', 'ü'],
    lessons: [
      { id: 'u4l1', title: 'T & Z', type: 'drill', newKeys: ['t', 'z'], icon: 'keyboard', baseLength: 70 },
      { id: 'u4l2', title: 'W & O', type: 'drill', newKeys: ['w', 'o'], icon: 'keyboard', baseLength: 70 },
      { id: 'u4l3', title: 'Q, P & Ü', type: 'drill', newKeys: ['q', 'p', 'ü'], icon: 'keyboard', baseLength: 70 },
      { id: 'u4l4', title: 'Wortschatz', type: 'words', newKeys: [], icon: 'book', baseLength: 100 },
      { id: 'u4l5', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 120 },
    ],
  },
  {
    id: 'u5',
    title: 'Untere Reihe',
    subtitle: 'Der letzte Buchstaben-Kurs',
    color: '#f59e0b',
    icon: 'flame',
    keys: ['y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
    lessons: [
      { id: 'u5l1', title: 'Y & X', type: 'drill', newKeys: ['y', 'x'], icon: 'keyboard', baseLength: 70 },
      { id: 'u5l2', title: 'C & V', type: 'drill', newKeys: ['c', 'v'], icon: 'keyboard', baseLength: 70 },
      { id: 'u5l3', title: 'B & N', type: 'drill', newKeys: ['b', 'n'], icon: 'keyboard', baseLength: 70 },
      { id: 'u5l4', title: 'M , .', type: 'drill', newKeys: ['m', ',', '.'], icon: 'keyboard', baseLength: 80 },
      { id: 'u5l5', title: 'Alphabet komplett', type: 'words', newKeys: [], icon: 'star', baseLength: 110 },
      { id: 'u5l6', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 130 },
    ],
  },
  {
    id: 'u6',
    title: 'Zahlenreihe',
    subtitle: 'Ziffern sicher treffen',
    color: '#8b5cf6',
    icon: 'numbers',
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    lessons: [
      { id: 'u6l1', title: '1, 2, 3', type: 'numbers', newKeys: ['1', '2', '3'], icon: 'numbers', baseLength: 60 },
      { id: 'u6l2', title: '4, 5, 6', type: 'numbers', newKeys: ['4', '5', '6'], icon: 'numbers', baseLength: 60 },
      { id: 'u6l3', title: '7, 8, 9, 0', type: 'numbers', newKeys: ['7', '8', '9', '0'], icon: 'numbers', baseLength: 70 },
      { id: 'u6l4', title: 'Zahlen im Text', type: 'numbers', newKeys: [], icon: 'numbers', baseLength: 90 },
      { id: 'u6l5', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 100 },
    ],
  },
  {
    id: 'u7',
    title: 'Großbuchstaben',
    subtitle: 'Shift wie ein Profi',
    color: '#ef4444',
    icon: 'shift',
    keys: [],
    lessons: [
      { id: 'u7l1', title: 'Shift rechts', type: 'drill', newKeys: [], icon: 'shift', baseLength: 70 },
      { id: 'u7l2', title: 'Shift links', type: 'drill', newKeys: [], icon: 'shift', baseLength: 70 },
      { id: 'u7l3', title: 'Satzanfänge', type: 'sentences', newKeys: [], icon: 'book', baseLength: 90 },
      { id: 'u7l4', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 110 },
    ],
  },
  {
    id: 'u8',
    title: 'Satzzeichen',
    subtitle: 'Feinschliff für echte Texte',
    color: '#ec4899',
    icon: 'pencil',
    keys: ['ä', ':', ';', '?', '!', '"', "'"],
    lessons: [
      { id: 'u8l1', title: 'Punkt & Komma', type: 'punctuation', newKeys: [], icon: 'pencil', baseLength: 80 },
      { id: 'u8l2', title: 'Frage & Ausruf', type: 'punctuation', newKeys: ['?', '!'], icon: 'pencil', baseLength: 80 },
      { id: 'u8l3', title: 'Umlaute Ä', type: 'punctuation', newKeys: ['ä'], icon: 'pencil', baseLength: 80 },
      { id: 'u8l4', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 100 },
    ],
  },
  {
    id: 'u9',
    title: 'Wörter & Sätze',
    subtitle: 'Fließend schreiben',
    color: '#14b8a6',
    icon: 'book',
    keys: [],
    lessons: [
      { id: 'u9l1', title: 'Alltagswörter', type: 'words', newKeys: [], icon: 'book', baseLength: 100 },
      { id: 'u9l2', title: 'Kurze Sätze', type: 'sentences', newKeys: [], icon: 'chat', baseLength: 110 },
      { id: 'u9l3', title: 'Lange Sätze', type: 'sentences', newKeys: [], icon: 'chat', baseLength: 130 },
      { id: 'u9l4', title: 'Textabschnitt', type: 'sentences', newKeys: [], icon: 'book', baseLength: 160 },
      { id: 'u9l5', title: 'Checkpoint', type: 'checkpoint', newKeys: [], icon: 'chest', baseLength: 140 },
    ],
  },
  {
    id: 'u10',
    title: 'Meisterschaft',
    subtitle: 'Geschwindigkeit & Ausdauer',
    color: '#f97316',
    icon: 'trophy',
    keys: [],
    lessons: [
      { id: 'u10l1', title: 'Tempo-Training', type: 'sentences', newKeys: [], icon: 'bolt', baseLength: 140 },
      { id: 'u10l2', title: 'Präzisions-Training', type: 'sentences', newKeys: [], icon: 'target', baseLength: 140 },
      { id: 'u10l3', title: 'Marathon', type: 'sentences', newKeys: [], icon: 'stopwatch', baseLength: 220 },
      { id: 'u10l4', title: 'Boss-Test', type: 'boss', newKeys: [], icon: 'crown', baseLength: 260 },
    ],
  },
]

export const ALL_LESSON_IDS: string[] = CURRICULUM.flatMap((u) => u.lessons.map((l) => l.id))

export function unitOfLesson(lessonId: string): UnitDef | undefined {
  return CURRICULUM.find((u) => u.lessons.some((l) => l.id === lessonId))
}

export function lessonById(lessonId: string): { unit: UnitDef; lesson: LessonDef } | undefined {
  for (const unit of CURRICULUM) {
    const lesson = unit.lessons.find((l) => l.id === lessonId)
    if (lesson) return { unit, lesson }
  }
  return undefined
}

/** cumulative set of unlocked characters up to (and including) a given unit index */
export function unlockedKeysUpTo(unitIndex: number): string[] {
  const keys = new Set<string>()
  for (let i = 0; i <= unitIndex && i < CURRICULUM.length; i++) {
    for (const k of CURRICULUM[i].keys) keys.add(k)
  }
  return Array.from(keys)
}

export function lessonIndex(lessonId: string): number {
  return ALL_LESSON_IDS.indexOf(lessonId)
}

/** all characters a learner has been taught by the time they reach this exact lesson (inclusive) */
export function allowedKeysForLesson(lessonId: string): string[] {
  const keys = new Set<string>()
  for (const unit of CURRICULUM) {
    const introducedThisUnit = new Set<string>()
    for (const lesson of unit.lessons) {
      for (const k of lesson.newKeys) introducedThisUnit.add(k)
      if (lesson.newKeys.length === 0) {
        // review/word/sentence/checkpoint lessons unlock the rest of the unit's key pool
        for (const k of unit.keys) introducedThisUnit.add(k)
      }
      for (const k of introducedThisUnit) keys.add(k)
      if (lesson.id === lessonId) return Array.from(keys)
    }
  }
  return Array.from(keys)
}
