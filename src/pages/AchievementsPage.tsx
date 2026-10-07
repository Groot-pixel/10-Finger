import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { ACHIEVEMENTS, nextTier, tierReached } from '../data/achievements'
import Icon from '../components/Icon'
import { AchievementBadge, BannerPattern } from '../components/Art'
import { Bar } from '../components/RightRail'

export default function AchievementsPage() {
  const claimed = useStore((s) => s.achievementsClaimed)
  const stats = useStore(useShallow((s) => ({
    totalXP: s.totalXP,
    longestStreak: s.longestStreak,
    totalCharsTyped: s.totalCharsTyped,
    perfectLessons: s.perfectLessons,
    lessonsCompleted: s.lessonsCompleted,
    bestWpm: s.bestWpm,
    unitsCompleted: s.unitsCompletedCount,
    earlyBirdCount: s.earlyBirdCount,
    nightOwlCount: s.nightOwlCount,
    bestCombo: s.bestCombo,
    checkpointsCleared: s.checkpointsCleared,
  })))

  const rows = ACHIEVEMENTS.map((ach) => {
    const value = stats[ach.metric] ?? 0
    const level = tierReached(value, ach.tiers)
    const maxLevel = ach.tiers[ach.tiers.length - 1].level
    const next = nextTier(value, ach.tiers)
    const pct = next ? Math.min(100, Math.round((value / next.threshold) * 100)) : 100
    const gemsEarned = ach.tiers.slice(0, claimed[ach.id] ?? 0).reduce((a, t) => a + t.gemReward, 0)
    return { ach, value, level, maxLevel, next, pct, gemsEarned }
  })
  const tiersReached = rows.reduce((a, r) => a + r.level, 0)
  const tiersTotal = rows.reduce((a, r) => a + r.maxLevel, 0)
  const gemsTotal = rows.reduce((a, r) => a + r.gemsEarned, 0)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="relative mb-6 overflow-hidden rounded-3xl px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #ffc800, #ff9600)', boxShadow: '0 5px 0 #d97f00' }}>
        <BannerPattern opacity={0.2} />
        <div className="relative flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-90">Deine Sammlung</div>
            <h1 className="text-2xl font-black">Erfolge</h1>
            <div className="mt-2 flex gap-2 text-xs font-extrabold">
              <span className="rounded-full bg-white/25 px-2.5 py-1">{tiersReached} / {tiersTotal} Stufen</span>
              <span className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1">
                <Icon name="gem" size={14} /> {gemsTotal} verdient
              </span>
            </div>
          </div>
          <Icon name="medal" size={76} />
        </div>
      </div>

      <div className="tile flex flex-col divide-y-2" style={{ borderColor: 'var(--border)' }}>
        {rows.map(({ ach, value, level, maxLevel, next, pct }) => (
          <div key={ach.id} className="flex items-center gap-4 p-4" style={{ borderColor: 'var(--border)' }}>
            <AchievementBadge icon={ach.icon} level={level} size={68} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[17px] font-extrabold">{ach.title}</span>
                <span className="flex gap-0.5" title={`Stufe ${level} von ${maxLevel}`}>
                  {Array.from({ length: maxLevel }, (_, i) => (
                    <span key={i} className="h-2 w-4 rounded-full" style={{ background: i < level ? '#ffc800' : 'var(--kb-key-bg)' }} />
                  ))}
                </span>
              </div>
              <div className="mb-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                {next ? ach.description(next.threshold) : 'Maximale Stufe erreicht!'}
              </div>
              <Bar
                pct={pct}
                color={next ? '#ffc800' : '#58cc02'}
                label={next ? `${value.toLocaleString('de-DE')} / ${next.threshold.toLocaleString('de-DE')}` : 'Geschafft'}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
