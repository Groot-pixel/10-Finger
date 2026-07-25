export interface LessonProgress {
  crownLevel: number
  bestWpm: number
  bestAccuracy: number
  timesCompleted: number
}

export interface KeyStat {
  attempts: number
  errors: number
}

export interface LessonResult {
  lessonId: string
  accuracy: number
  wpm: number
  charsTyped: number
  mistakeCount: number
  maxCombo: number
  durationSec: number
  errorsByChar: Record<string, number>
  attemptsByChar: Record<string, number>
  heartsLost: number
  isPractice?: boolean
}

export type ViewKind =
  | 'path' | 'lesson' | 'practice' | 'league' | 'achievements'
  | 'shop' | 'profile' | 'placement' | 'quests'

export interface ActiveSession {
  kind: 'path' | 'practice' | 'speedtest' | 'placement'
  lessonId?: string
  crownLevel?: number
  text?: string
}

export interface ToastMsg {
  id: string
  icon: string
  title: string
  subtitle?: string
  tone: 'success' | 'info' | 'warning' | 'achievement'
}

export interface LeagueResultBanner {
  promoted: boolean
  demoted: boolean
  leagueName: string
  leagueIcon: string
}
