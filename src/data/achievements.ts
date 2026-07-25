export type StatKey =
  | 'totalXP' | 'longestStreak' | 'totalCharsTyped' | 'perfectLessons'
  | 'lessonsCompleted' | 'bestWpm' | 'unitsCompleted' | 'earlyBirdCount'
  | 'nightOwlCount' | 'bestCombo' | 'checkpointsCleared'

export interface AchievementTier {
  level: number
  threshold: number
  gemReward: number
}

export interface AchievementDef {
  id: string
  title: string
  description: (threshold: number) => string
  icon: string
  metric: StatKey
  tiers: AchievementTier[]
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'wildfire',
    title: 'Wildfeuer',
    description: (t) => `Erreiche eine Serie von ${t} Tagen`,
    icon: '🔥',
    metric: 'longestStreak',
    tiers: [
      { level: 1, threshold: 3, gemReward: 10 },
      { level: 2, threshold: 7, gemReward: 20 },
      { level: 3, threshold: 30, gemReward: 50 },
      { level: 4, threshold: 100, gemReward: 150 },
    ],
  },
  {
    id: 'sharpshooter',
    title: 'Scharfschütze',
    description: (t) => `Beende ${t} Lektionen mit 100% Genauigkeit`,
    icon: '🎯',
    metric: 'perfectLessons',
    tiers: [
      { level: 1, threshold: 1, gemReward: 10 },
      { level: 2, threshold: 10, gemReward: 25 },
      { level: 3, threshold: 50, gemReward: 60 },
      { level: 4, threshold: 150, gemReward: 150 },
    ],
  },
  {
    id: 'speed-demon',
    title: 'Tempo-Dämon',
    description: (t) => `Erreiche ${t} WPM in einer Lektion`,
    icon: '⚡',
    metric: 'bestWpm',
    tiers: [
      { level: 1, threshold: 20, gemReward: 10 },
      { level: 2, threshold: 40, gemReward: 25 },
      { level: 3, threshold: 60, gemReward: 60 },
      { level: 4, threshold: 90, gemReward: 150 },
    ],
  },
  {
    id: 'marathoner',
    title: 'Marathonläufer',
    description: (t) => `Tippe insgesamt ${t.toLocaleString('de-DE')} Zeichen`,
    icon: '🏃',
    metric: 'totalCharsTyped',
    tiers: [
      { level: 1, threshold: 1000, gemReward: 10 },
      { level: 2, threshold: 10000, gemReward: 30 },
      { level: 3, threshold: 50000, gemReward: 80 },
      { level: 4, threshold: 200000, gemReward: 200 },
    ],
  },
  {
    id: 'scholar',
    title: 'Gelehrter',
    description: (t) => `Schließe ${t} Lektionen ab`,
    icon: '📚',
    metric: 'lessonsCompleted',
    tiers: [
      { level: 1, threshold: 5, gemReward: 10 },
      { level: 2, threshold: 25, gemReward: 25 },
      { level: 3, threshold: 75, gemReward: 60 },
      { level: 4, threshold: 200, gemReward: 150 },
    ],
  },
  {
    id: 'conqueror',
    title: 'Eroberer',
    description: (t) => `Schließe ${t} Unit${t > 1 ? 's' : ''} ab`,
    icon: '🏆',
    metric: 'unitsCompleted',
    tiers: [
      { level: 1, threshold: 1, gemReward: 15 },
      { level: 2, threshold: 3, gemReward: 30 },
      { level: 3, threshold: 6, gemReward: 70 },
      { level: 4, threshold: 10, gemReward: 200 },
    ],
  },
  {
    id: 'early-bird',
    title: 'Frühaufsteher',
    description: (t) => `Übe ${t}-mal vor 8 Uhr morgens`,
    icon: '🌅',
    metric: 'earlyBirdCount',
    tiers: [
      { level: 1, threshold: 1, gemReward: 10 },
      { level: 2, threshold: 10, gemReward: 25 },
      { level: 3, threshold: 30, gemReward: 60 },
    ],
  },
  {
    id: 'night-owl',
    title: 'Nachteule',
    description: (t) => `Übe ${t}-mal nach 22 Uhr abends`,
    icon: '🌙',
    metric: 'nightOwlCount',
    tiers: [
      { level: 1, threshold: 1, gemReward: 10 },
      { level: 2, threshold: 10, gemReward: 25 },
      { level: 3, threshold: 30, gemReward: 60 },
    ],
  },
  {
    id: 'combo-king',
    title: 'Combo-König',
    description: (t) => `Erreiche eine Fehlerfrei-Combo von ${t} Zeichen`,
    icon: '💫',
    metric: 'bestCombo',
    tiers: [
      { level: 1, threshold: 25, gemReward: 10 },
      { level: 2, threshold: 75, gemReward: 25 },
      { level: 3, threshold: 200, gemReward: 60 },
    ],
  },
  {
    id: 'checkpoint-champion',
    title: 'Checkpoint-Champion',
    description: (t) => `Bestehe ${t} Checkpoints`,
    icon: '🚩',
    metric: 'checkpointsCleared',
    tiers: [
      { level: 1, threshold: 1, gemReward: 15 },
      { level: 2, threshold: 4, gemReward: 40 },
      { level: 3, threshold: 8, gemReward: 90 },
    ],
  },
]

export function tierReached(metricValue: number, tiers: AchievementTier[]): number {
  let level = 0
  for (const t of tiers) if (metricValue >= t.threshold) level = t.level
  return level
}

export function nextTier(metricValue: number, tiers: AchievementTier[]): AchievementTier | undefined {
  return tiers.find((t) => metricValue < t.threshold)
}
