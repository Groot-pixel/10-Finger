export type QuestMetric = 'xpEarnedToday' | 'lessonsCompletedToday' | 'perfectLessonsToday' | 'charsTypedToday' | 'bestComboToday'

export interface QuestTemplate {
  id: string
  metric: QuestMetric
  title: (goal: number) => string
  icon: string
  goalOptions: number[]
  gemReward: number
  xpReward: number
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'earn-xp',
    metric: 'xpEarnedToday',
    title: (g) => `Sammle ${g} EP`,
    icon: 'star',
    goalOptions: [20, 30, 50],
    gemReward: 5,
    xpReward: 0,
  },
  {
    id: 'complete-lessons',
    metric: 'lessonsCompletedToday',
    title: (g) => `Schließe ${g} Lektion${g > 1 ? 'en' : ''} ab`,
    icon: 'book',
    goalOptions: [1, 2, 3],
    gemReward: 5,
    xpReward: 5,
  },
  {
    id: 'perfect-lesson',
    metric: 'perfectLessonsToday',
    title: (g) => `Beende ${g} Lektion${g > 1 ? 'en' : ''} ohne Fehler`,
    icon: 'target',
    goalOptions: [1, 2],
    gemReward: 10,
    xpReward: 10,
  },
  {
    id: 'type-chars',
    metric: 'charsTypedToday',
    title: (g) => `Tippe ${g} Zeichen`,
    icon: 'keyboard',
    goalOptions: [150, 300, 500],
    gemReward: 8,
    xpReward: 5,
  },
  {
    id: 'combo',
    metric: 'bestComboToday',
    title: (g) => `Erreiche eine Combo von ${g}`,
    icon: 'sparkle',
    goalOptions: [15, 30, 50],
    gemReward: 8,
    xpReward: 5,
  },
]

export interface DailyQuest {
  id: string
  templateId: string
  metric: QuestMetric
  title: string
  icon: string
  goal: number
  gemReward: number
  xpReward: number
}

export function buildDailyQuests(seedRng: () => number): DailyQuest[] {
  const shuffled = [...QUEST_TEMPLATES].sort(() => seedRng() - 0.5)
  return shuffled.slice(0, 3).map((tpl) => {
    const goal = tpl.goalOptions[Math.floor(seedRng() * tpl.goalOptions.length)]
    return {
      id: `${tpl.id}-${goal}`,
      templateId: tpl.id,
      metric: tpl.metric,
      title: tpl.title(goal),
      icon: tpl.icon,
      goal,
      gemReward: tpl.gemReward,
      xpReward: tpl.xpReward,
    }
  })
}
