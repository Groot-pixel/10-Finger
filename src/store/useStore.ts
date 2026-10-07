import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CURRICULUM, lessonById, allowedKeysForLesson } from '../data/curriculum'
import { ACHIEVEMENTS, tierReached } from '../data/achievements'
import { buildDailyQuests, type DailyQuest } from '../data/quests'
import { getWeekStartISO, computeLeagueBoard } from '../data/league'
import { mulberry32, seedFromString } from '../data/content'
import { SHOP_ITEMS } from '../data/shop'
import type { LessonProgress, KeyStat, LessonResult, ViewKind, ActiveSession, ToastMsg, LeagueResultBanner } from '../types'

export function todayISO(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function dayDiff(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00Z').getTime()
  const b = new Date(bISO + 'T00:00:00Z').getTime()
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

/** one finished lesson / practice session, used for the activity calendar and the progress chart */
export interface SessionLogEntry {
  /** local date YYYY-MM-DD */
  d: string
  xp: number
  wpm: number
  acc: number
}

interface State {
  // profile
  name: string
  avatar: string
  createdAt: string
  dailyGoalXP: number

  // core currencies
  totalXP: number
  gems: number
  xpBoostLessonsLeft: number

  // streak
  currentStreak: number
  longestStreak: number
  lastPracticeDateISO: string | null
  streakFreezes: number

  // progress
  lessonProgress: Record<string, LessonProgress>
  keyStats: Record<string, KeyStat>
  currentUnitIndex: number
  placementDone: boolean
  completedUnitIds: string[]

  // stats used for achievements
  totalCharsTyped: number
  perfectLessons: number
  lessonsCompleted: number
  bestWpm: number
  unitsCompletedCount: number
  earlyBirdCount: number
  nightOwlCount: number
  bestCombo: number
  checkpointsCleared: number
  achievementsClaimed: Record<string, number>
  sessionLog: SessionLogEntry[]

  // daily quest state
  dailyDateISO: string
  dailyQuests: DailyQuest[]
  xpEarnedToday: number
  lessonsCompletedToday: number
  perfectLessonsToday: number
  charsTypedToday: number
  bestComboToday: number
  claimedQuestIds: string[]

  // league
  leagueDivisionIndex: number
  leagueWeekStartISO: string
  leagueWeeklyXP: number
  leagueBanner: LeagueResultBanner | null

  // shop
  ownedItems: string[]
  equippedCosmetics: string[]
  darkMode: boolean
  soundEnabled: boolean

  // ui
  view: ViewKind
  activeSession: ActiveSession | null
  toasts: ToastMsg[]

  // actions
  setView: (v: ViewKind) => void
  startPathLesson: (lessonId: string) => void
  startPractice: (text: string) => void
  startSpeedTest: (text: string) => void
  startPlacement: (text: string) => void
  cancelSession: () => void
  completeLesson: (result: LessonResult) => { xpEarned: number; gemsEarned: number; crownUp: boolean; precisionHearts: number }
  buyItem: (itemId: string, price: number) => boolean
  equipCosmetic: (itemId: string) => void
  useStreakFreeze: () => void
  toggleDarkMode: () => void
  toggleSound: () => void
  setDailyGoal: (xp: number) => void
  pushToast: (t: Omit<ToastMsg, 'id'>) => void
  dismissToast: (id: string) => void
  ensureDaily: () => void
  ensureLeagueWeek: () => void
  dismissLeagueBanner: () => void
  resetProgress: () => void
  applyPlacement: (skipToUnitIndex: number) => void
}

function computeXpForResult(r: LessonResult, xpBoostActive: boolean): number {
  let xp = Math.round(r.charsTyped / 5) // base: ~1 xp per word
  xp += Math.round(r.accuracy >= 100 ? 15 : r.accuracy >= 95 ? 8 : r.accuracy >= 85 ? 4 : 0)
  xp += Math.round(r.wpm >= 60 ? 10 : r.wpm >= 40 ? 5 : r.wpm >= 25 ? 2 : 0)
  if (r.heartsLost === 0) xp += 5
  xp = Math.max(5, xp)
  if (xpBoostActive) xp *= 2
  return xp
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      name: 'Tippstar',
      avatar: '🦎',
      createdAt: new Date().toISOString(),
      dailyGoalXP: 30,

      totalXP: 0,
      gems: 50,
      xpBoostLessonsLeft: 0,

      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDateISO: null,
      streakFreezes: 0,

      lessonProgress: {},
      keyStats: {},
      currentUnitIndex: 0,
      placementDone: false,
      completedUnitIds: [],

      totalCharsTyped: 0,
      perfectLessons: 0,
      lessonsCompleted: 0,
      bestWpm: 0,
      unitsCompletedCount: 0,
      earlyBirdCount: 0,
      nightOwlCount: 0,
      bestCombo: 0,
      checkpointsCleared: 0,
      achievementsClaimed: {},
      sessionLog: [],

      dailyDateISO: todayISO(),
      dailyQuests: buildDailyQuests(mulberry32(seedFromString(todayISO()))),
      xpEarnedToday: 0,
      lessonsCompletedToday: 0,
      perfectLessonsToday: 0,
      charsTypedToday: 0,
      bestComboToday: 0,
      claimedQuestIds: [],

      leagueDivisionIndex: 0,
      leagueWeekStartISO: getWeekStartISO(),
      leagueWeeklyXP: 0,
      leagueBanner: null,

      ownedItems: [],
      equippedCosmetics: [],
      darkMode: typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
      soundEnabled: true,

      view: 'path',
      activeSession: null,
      toasts: [],

      setView: (v) => set({ view: v }),

      startPathLesson: (lessonId) => {
        const found = lessonById(lessonId)
        if (!found) return
        set({ activeSession: { kind: 'path', lessonId }, view: 'lesson' })
      },
      startPractice: (text) => set({ activeSession: { kind: 'practice', text }, view: 'lesson' }),
      startSpeedTest: (text) => set({ activeSession: { kind: 'speedtest', text }, view: 'lesson' }),
      startPlacement: (text) => set({ activeSession: { kind: 'placement', text }, view: 'lesson' }),
      cancelSession: () => set({ activeSession: null, view: 'path' }),

      pushToast: (t) => {
        const id = Math.random().toString(36).slice(2)
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
        setTimeout(() => get().dismissToast(id), 4200)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      ensureDaily: () => {
        const today = todayISO()
        if (get().dailyDateISO !== today) {
          set({
            dailyDateISO: today,
            dailyQuests: buildDailyQuests(mulberry32(seedFromString(today))),
            xpEarnedToday: 0,
            lessonsCompletedToday: 0,
            perfectLessonsToday: 0,
            charsTypedToday: 0,
            bestComboToday: 0,
            claimedQuestIds: [],
          })
        }
      },

      ensureLeagueWeek: () => {
        const currentWeek = getWeekStartISO()
        const s = get()
        if (s.leagueWeekStartISO === currentWeek) return
        // resolve previous week
        const board = computeLeagueBoard(s.leagueDivisionIndex, s.leagueWeekStartISO, s.name, s.leagueWeeklyXP, new Date())
        const rank = board.findIndex((e) => e.isPlayer) + 1
        let newDivision = s.leagueDivisionIndex
        let promoted = false
        let demoted = false
        if (rank <= 7 && s.leagueDivisionIndex < 9) {
          newDivision = s.leagueDivisionIndex + 1
          promoted = true
        } else if (rank > board.length - 5 && s.leagueDivisionIndex > 0) {
          newDivision = s.leagueDivisionIndex - 1
          demoted = true
        }
        const leagueNames = ['Bronze', 'Silber', 'Gold', 'Saphir', 'Rubin', 'Smaragd', 'Amethyst', 'Perle', 'Obsidian', 'Diamant']
        const icons = ['🥉', '🥈', '🥇', '💠', '💎', '💚', '🔮', '🫧', '⚫', '💎']
        set({
          leagueDivisionIndex: newDivision,
          leagueWeekStartISO: currentWeek,
          leagueWeeklyXP: 0,
          leagueBanner: promoted || demoted
            ? { promoted, demoted, leagueName: leagueNames[newDivision], leagueIcon: icons[newDivision] }
            : null,
        })
      },
      dismissLeagueBanner: () => set({ leagueBanner: null }),

      buyItem: (itemId, price) => {
        const s = get()
        if (s.gems < price) return false
        if (itemId === 'streak-freeze') {
          set({ gems: s.gems - price, streakFreezes: s.streakFreezes + 1 })
          return true
        }
        if (itemId === 'xp-boost') {
          set({ gems: s.gems - price, xpBoostLessonsLeft: s.xpBoostLessonsLeft + 3 })
          return true
        }
        // cosmetic (one-time purchase)
        if (s.ownedItems.includes(itemId)) return false
        set({ gems: s.gems - price, ownedItems: [...s.ownedItems, itemId], equippedCosmetics: [...s.equippedCosmetics, itemId] })
        return true
      },

      equipCosmetic: (itemId) => {
        const s = get()
        if (!s.ownedItems.includes(itemId)) return
        const isEquipped = s.equippedCosmetics.includes(itemId)
        if (isEquipped) {
          set({ equippedCosmetics: s.equippedCosmetics.filter((i) => i !== itemId) })
          return
        }
        const slot = SHOP_ITEMS.find((i) => i.id === itemId)?.slot
        const withoutSlotConflicts = slot
          ? s.equippedCosmetics.filter((i) => SHOP_ITEMS.find((it) => it.id === i)?.slot !== slot)
          : s.equippedCosmetics
        set({ equippedCosmetics: [...withoutSlotConflicts, itemId] })
      },

      useStreakFreeze: () => {
        const s = get()
        if (s.streakFreezes <= 0) return
        set({ streakFreezes: s.streakFreezes - 1 })
      },

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setDailyGoal: (xp) => set({ dailyGoalXP: xp }),

      completeLesson: (result) => {
        const s = get()
        get().ensureDaily()
        get().ensureLeagueWeek()

        const precisionHearts = Math.max(0, 5 - result.heartsLost)
        const xpBoostActive = s.xpBoostLessonsLeft > 0 && !result.isPractice
        const xpEarned = result.isPractice ? Math.max(3, Math.round(result.charsTyped / 8)) : computeXpForResult(result, xpBoostActive)
        let gemsEarned = 0
        if (!result.isPractice && precisionHearts > 0) gemsEarned += precisionHearts

        // streak update (only for real practice sessions, once per day)
        const today = todayISO()
        let { currentStreak, longestStreak, lastPracticeDateISO, streakFreezes } = s
        if (lastPracticeDateISO !== today) {
          if (lastPracticeDateISO) {
            const gap = dayDiff(lastPracticeDateISO, today)
            if (gap === 1) {
              currentStreak += 1
            } else if (gap > 1) {
              const freezesNeeded = gap - 1
              if (streakFreezes >= freezesNeeded) {
                streakFreezes -= freezesNeeded
                currentStreak += 1
              } else {
                currentStreak = 1
              }
            }
          } else {
            currentStreak = 1
          }
          lastPracticeDateISO = today
          longestStreak = Math.max(longestStreak, currentStreak)
          gemsEarned += 5
        }

        // lesson progress / crowns
        let crownUp = false
        const progressMap = { ...s.lessonProgress }
        if (!result.isPractice && s.activeSession?.lessonId) {
          const lid = s.activeSession.lessonId
          const prev = progressMap[lid] ?? { crownLevel: 0, bestWpm: 0, bestAccuracy: 0, timesCompleted: 0 }
          const passed = result.accuracy >= 70
          const newCrown = passed ? Math.min(5, prev.crownLevel + 1) : prev.crownLevel
          crownUp = newCrown > prev.crownLevel
          progressMap[lid] = {
            crownLevel: newCrown,
            bestWpm: Math.max(prev.bestWpm, result.wpm),
            bestAccuracy: Math.max(prev.bestAccuracy, result.accuracy),
            timesCompleted: prev.timesCompleted + 1,
          }
        }

        // key stats
        const keyStats = { ...s.keyStats }
        for (const [ch, count] of Object.entries(result.attemptsByChar)) {
          const prev = keyStats[ch] ?? { attempts: 0, errors: 0 }
          keyStats[ch] = { attempts: prev.attempts + count, errors: prev.errors + (result.errorsByChar[ch] ?? 0) }
        }

        const now = new Date()
        const hour = now.getHours()

        // unit completion check (tracked by id set so it can only fire once per unit)
        let unitsCompletedCount = s.unitsCompletedCount
        const completedUnitIds = [...s.completedUnitIds]
        if (!result.isPractice && s.activeSession?.lessonId) {
          const found = lessonById(s.activeSession.lessonId)
          if (found && crownUp && !completedUnitIds.includes(found.unit.id)) {
            const allDone = found.unit.lessons.every((l) => (progressMap[l.id]?.crownLevel ?? 0) > 0)
            if (allDone) {
              completedUnitIds.push(found.unit.id)
              unitsCompletedCount += 1
              gemsEarned += 20
            }
          }
        }

        const checkpointsCleared = s.checkpointsCleared + (!result.isPractice && result.accuracy >= 70 && s.activeSession?.lessonId && lessonById(s.activeSession.lessonId)?.lesson.type === 'checkpoint' ? 1 : 0)
          + (!result.isPractice && result.accuracy >= 70 && s.activeSession?.lessonId && lessonById(s.activeSession.lessonId)?.lesson.type === 'boss' ? 1 : 0)

        const nextState = {
          totalXP: s.totalXP + xpEarned,
          gems: s.gems + gemsEarned,
          currentStreak,
          longestStreak,
          lastPracticeDateISO,
          streakFreezes,
          lessonProgress: progressMap,
          keyStats,
          totalCharsTyped: s.totalCharsTyped + result.charsTyped,
          perfectLessons: s.perfectLessons + (result.accuracy >= 100 ? 1 : 0),
          lessonsCompleted: s.lessonsCompleted + (result.isPractice ? 0 : 1),
          bestWpm: Math.max(s.bestWpm, result.wpm),
          unitsCompletedCount,
          completedUnitIds,
          earlyBirdCount: s.earlyBirdCount + (hour < 8 ? 1 : 0),
          nightOwlCount: s.nightOwlCount + (hour >= 22 ? 1 : 0),
          bestCombo: Math.max(s.bestCombo, result.maxCombo),
          checkpointsCleared,
          xpEarnedToday: s.xpEarnedToday + xpEarned,
          lessonsCompletedToday: s.lessonsCompletedToday + (result.isPractice ? 0 : 1),
          perfectLessonsToday: s.perfectLessonsToday + (result.accuracy >= 100 ? 1 : 0),
          charsTypedToday: s.charsTypedToday + result.charsTyped,
          bestComboToday: Math.max(s.bestComboToday, result.maxCombo),
          leagueWeeklyXP: s.leagueWeeklyXP + xpEarned,
          xpBoostLessonsLeft: Math.max(0, s.xpBoostLessonsLeft - (result.isPractice ? 0 : 1)),
          sessionLog: [...(s.sessionLog ?? []), { d: today, xp: xpEarned, wpm: result.wpm, acc: result.accuracy }].slice(-200),
        }
        set(nextState)

        // achievement checks
        const statSnapshot: Record<string, number> = {
          totalXP: nextState.totalXP,
          longestStreak: nextState.longestStreak,
          totalCharsTyped: nextState.totalCharsTyped,
          perfectLessons: nextState.perfectLessons,
          lessonsCompleted: nextState.lessonsCompleted,
          bestWpm: nextState.bestWpm,
          unitsCompleted: nextState.unitsCompletedCount,
          earlyBirdCount: nextState.earlyBirdCount,
          nightOwlCount: nextState.nightOwlCount,
          bestCombo: nextState.bestCombo,
          checkpointsCleared: nextState.checkpointsCleared,
        }
        const claimed = { ...get().achievementsClaimed }
        let gemBonus = 0
        for (const ach of ACHIEVEMENTS) {
          const val = statSnapshot[ach.metric] ?? 0
          const level = tierReached(val, ach.tiers)
          const prevLevel = claimed[ach.id] ?? 0
          if (level > prevLevel) {
            for (let l = prevLevel + 1; l <= level; l++) {
              const tier = ach.tiers.find((t) => t.level === l)
              if (tier) gemBonus += tier.gemReward
            }
            claimed[ach.id] = level
            get().pushToast({ icon: ach.icon, title: `Erfolg freigeschaltet: ${ach.title}`, subtitle: `Stufe ${level}`, tone: 'achievement' })
          }
        }
        if (gemBonus > 0) set({ gems: get().gems + gemBonus, achievementsClaimed: claimed })
        else set({ achievementsClaimed: claimed })

        // quest completion toasts + rewards
        const qState = get()
        let questGemBonus = 0
        const newClaimed = [...qState.claimedQuestIds]
        for (const q of qState.dailyQuests) {
          if (newClaimed.includes(q.id)) continue
          const progressVal = {
            xpEarnedToday: qState.xpEarnedToday,
            lessonsCompletedToday: qState.lessonsCompletedToday,
            perfectLessonsToday: qState.perfectLessonsToday,
            charsTypedToday: qState.charsTypedToday,
            bestComboToday: qState.bestComboToday,
          }[q.metric]
          if (progressVal >= q.goal) {
            newClaimed.push(q.id)
            questGemBonus += q.gemReward
            get().pushToast({ icon: q.icon, title: 'Tagesaufgabe erledigt!', subtitle: q.title, tone: 'success' })
          }
        }
        if (questGemBonus > 0) set({ gems: get().gems + questGemBonus, claimedQuestIds: newClaimed })
        else if (newClaimed.length !== qState.claimedQuestIds.length) set({ claimedQuestIds: newClaimed })

        if (crownUp) {
          get().pushToast({ icon: 'crown', title: 'Kronen-Level aufgestiegen!', tone: 'success' })
        }
        if (!result.isPractice && precisionHearts === 5) {
          get().pushToast({ icon: 'gem', title: 'Makellos! Präzisions-Bonus erhalten', subtitle: `+${precisionHearts} Gems`, tone: 'success' })
        }

        return { xpEarned, gemsEarned: gemsEarned + gemBonus + questGemBonus, crownUp, precisionHearts }
      },

      applyPlacement: (skipToUnitIndex) => {
        const progressMap = { ...get().lessonProgress }
        const completedUnitIds = [...get().completedUnitIds]
        for (let i = 0; i < Math.min(skipToUnitIndex, CURRICULUM.length); i++) {
          const unit = CURRICULUM[i]
          for (const l of unit.lessons) {
            progressMap[l.id] = progressMap[l.id]?.crownLevel ? progressMap[l.id] : { crownLevel: 1, bestWpm: 0, bestAccuracy: 0, timesCompleted: 1 }
          }
          if (!completedUnitIds.includes(unit.id)) completedUnitIds.push(unit.id)
        }
        set({
          lessonProgress: progressMap,
          completedUnitIds,
          currentUnitIndex: Math.min(skipToUnitIndex, CURRICULUM.length - 1),
          placementDone: true,
          unitsCompletedCount: completedUnitIds.length,
          gems: get().gems + 25,
        })
        get().pushToast({ icon: 'rocket', title: 'Einstufungstest abgeschlossen!', subtitle: 'Dein Lernpfad wurde angepasst.', tone: 'success' })
      },

      resetProgress: () => {
        set({
          totalXP: 0, gems: 50,
          xpBoostLessonsLeft: 0, currentStreak: 0, longestStreak: 0, lastPracticeDateISO: null,
          streakFreezes: 0, lessonProgress: {}, keyStats: {}, currentUnitIndex: 0, placementDone: false,
          completedUnitIds: [],
          totalCharsTyped: 0, perfectLessons: 0, lessonsCompleted: 0, bestWpm: 0, unitsCompletedCount: 0,
          earlyBirdCount: 0, nightOwlCount: 0, bestCombo: 0, checkpointsCleared: 0, achievementsClaimed: {}, sessionLog: [],
          dailyDateISO: todayISO(), dailyQuests: buildDailyQuests(mulberry32(seedFromString(todayISO()))),
          xpEarnedToday: 0, lessonsCompletedToday: 0, perfectLessonsToday: 0, charsTypedToday: 0,
          bestComboToday: 0, claimedQuestIds: [], leagueDivisionIndex: 0, leagueWeekStartISO: getWeekStartISO(),
          leagueWeeklyXP: 0, leagueBanner: null, ownedItems: [], equippedCosmetics: [], view: 'path',
          activeSession: null,
        })
      },
    }),
    { name: 'zehnfinger-save-v1' },
  ),
)

export function unlockedKeysForPlayer(): string[] {
  const s = useStore.getState()
  // unlocked = keys from all units up to the highest unit containing a completed lesson, plus current in-progress unit
  let lastTouchedUnitIdx = 0
  CURRICULUM.forEach((u, idx) => {
    if (u.lessons.some((l) => (s.lessonProgress[l.id]?.crownLevel ?? 0) > 0)) lastTouchedUnitIdx = idx
  })
  const keys = new Set<string>()
  for (let i = 0; i <= Math.min(lastTouchedUnitIdx + 1, CURRICULUM.length - 1); i++) {
    for (const k of CURRICULUM[i].keys) keys.add(k)
  }
  return Array.from(keys)
}

export function weakestKeys(count = 6): string[] {
  const s = useStore.getState()
  const entries = Object.entries(s.keyStats)
    .filter(([, v]) => v.attempts >= 5)
    .map(([ch, v]) => ({ ch, rate: v.errors / v.attempts }))
    .filter((e) => e.rate > 0)
    .sort((a, b) => b.rate - a.rate)
  return entries.slice(0, count).map((e) => e.ch)
}

export { allowedKeysForLesson }

/** simple XP curve: level N requires N*80 more XP than the previous level */
export function levelFromXP(totalXP: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  let level = 1
  let remaining = totalXP
  let need = 80
  while (remaining >= need) {
    remaining -= need
    level += 1
    need = 80 + level * 20
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: need }
}
