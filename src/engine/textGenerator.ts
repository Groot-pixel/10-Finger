import { allowedKeysForLesson, lessonById } from '../data/curriculum'
import {
  WORDS_SHORT, WORDS_MEDIUM, WORDS_LONG, SENTENCES, NUMBER_SNIPPETS,
  PUNCTUATION_SNIPPETS, mulberry32,
} from '../data/content'

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function wordUsableWith(word: string, allowed: Set<string>): boolean {
  for (const ch of word.toLowerCase()) {
    if (ch === ' ') continue
    if (!allowed.has(ch)) return false
  }
  return true
}

function sentenceUsableWith(sentence: string, allowed: Set<string>, allowCapitalsAndPunct: boolean): boolean {
  for (const ch of sentence) {
    if (ch === ' ') continue
    const lower = ch.toLowerCase()
    const isUpper = ch !== lower
    if (isUpper) {
      if (!allowCapitalsAndPunct) return false
      if (!allowed.has(lower)) return false
      continue
    }
    if (/[a-zäöüß]/.test(lower)) {
      if (!allowed.has(lower)) return false
    }
    // punctuation always allowed once allowCapitalsAndPunct is true (u7+)
    if (!allowCapitalsAndPunct && /[.,!?;:"'-]/.test(ch)) return false
  }
  return true
}

/** builds pseudo-word drills emphasising newly taught keys, home-row style */
function generateDrill(newKeys: string[], allowed: string[], targetLen: number, rng: () => number): string {
  const focus = newKeys.length ? newKeys : allowed
  const pool = allowed.length ? allowed : focus
  const chunks: string[] = []
  let len = 0
  while (len < targetLen) {
    const wordLen = 2 + Math.floor(rng() * 3) // 2-4 chars
    let word = ''
    for (let i = 0; i < wordLen; i++) {
      // 65% chance to use a focus (new) key, else any unlocked key, for spaced repetition
      const useFocus = rng() < 0.65 && focus.length > 0
      const source = useFocus ? focus : pool
      word += pick(source, rng)
    }
    chunks.push(word)
    len += wordLen + 1
  }
  return chunks.join(' ')
}

function generateFromWords(allowed: Set<string>, targetLen: number, rng: () => number): string {
  const pool = [...WORDS_SHORT, ...WORDS_MEDIUM, ...WORDS_LONG].filter((w) => wordUsableWith(w, allowed))
  const words = pool.length ? pool : WORDS_SHORT
  const chunks: string[] = []
  let len = 0
  while (len < targetLen) {
    const w = pick(words, rng)
    chunks.push(w)
    len += w.length + 1
  }
  return chunks.join(' ')
}

function generateFromSentences(allowed: Set<string>, targetLen: number, rng: () => number, allowCapitals: boolean): string {
  const pool = SENTENCES.filter((s) => sentenceUsableWith(s, allowed, allowCapitals))
  const chosen: string[] = []
  let len = 0
  const source = pool.length ? pool : SENTENCES
  const shuffled = [...source].sort(() => rng() - 0.5)
  let i = 0
  while (len < targetLen) {
    const s = shuffled[i % shuffled.length]
    chosen.push(s)
    len += s.length + 1
    i++
  }
  return chosen.join(' ')
}

function generateNumbers(targetLen: number, rng: () => number): string {
  const chunks: string[] = []
  let len = 0
  while (len < targetLen) {
    const n = pick(NUMBER_SNIPPETS, rng)
    chunks.push(n)
    len += n.length + 1
  }
  return chunks.join(' ')
}

function generatePunctuation(targetLen: number, rng: () => number): string {
  const chunks: string[] = []
  let len = 0
  while (len < targetLen) {
    const p = pick(PUNCTUATION_SNIPPETS, rng)
    chunks.push(p)
    len += p.length + 1
  }
  return chunks.join(' ')
}

export interface GeneratedLesson {
  text: string
  targetLength: number
}

/** crownLevel: 0-4, each level adds length + difficulty */
export function generateLessonText(lessonId: string, crownLevel: number, seedExtra = ''): GeneratedLesson {
  const found = lessonById(lessonId)
  if (!found) return { text: '', targetLength: 0 }
  const { lesson, unit } = found
  const allowedArr = allowedKeysForLesson(lessonId)
  const allowedSet = new Set(allowedArr)
  const targetLength = lesson.baseLength + crownLevel * 18
  const rng = mulberry32(Date.now() ^ crownLevel * 7919 ^ seedExtra.length + hashStr(lessonId + seedExtra))

  let text = ''
  switch (lesson.type) {
    case 'drill':
      text = generateDrill(lesson.newKeys, allowedArr, targetLength, rng)
      break
    case 'words':
      text = generateFromWords(allowedSet, targetLength, rng)
      break
    case 'sentences':
      text = generateFromSentences(allowedSet, targetLength, rng, true)
      break
    case 'numbers':
      text = generateNumbers(targetLength, rng)
      break
    case 'punctuation':
      text = generatePunctuation(targetLength, rng)
      break
    case 'checkpoint':
    case 'boss': {
      const half = Math.floor(targetLength / 2)
      const allowCaps = unit.id !== 'u1' && unit.id !== 'u2' && unit.id !== 'u3' && unit.id !== 'u4' && unit.id !== 'u5' && unit.id !== 'u6'
      text = `${generateFromWords(allowedSet, half, rng)} ${allowCaps ? generateFromSentences(allowedSet, half, rng, true) : generateDrill([], allowedArr, half, rng)}`
      break
    }
  }
  return { text: text.trim(), targetLength }
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h >>> 0
}

/** generates weak-key focused practice text for the adaptive Practice Hub */
export function generateWeakKeyPractice(weakKeys: string[], unlockedKeys: string[], targetLength: number): GeneratedLesson {
  const rng = mulberry32(Date.now())
  const focus = weakKeys.length ? weakKeys : unlockedKeys
  const text = generateDrill(focus, unlockedKeys.length ? unlockedKeys : focus, targetLength, rng)
  return { text, targetLength }
}

export function generateSpeedTestText(unlockedKeys: string[], targetLength: number): GeneratedLesson {
  const rng = mulberry32(Date.now())
  const allowedSet = new Set(unlockedKeys)
  const text = generateFromSentences(allowedSet, targetLength, rng, true)
  return { text: text || generateFromWords(allowedSet, targetLength, rng), targetLength }
}
