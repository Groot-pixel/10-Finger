import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { ACHIEVEMENTS, nextTier, tierReached } from '../data/achievements'

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-extrabold">🎖️ Erfolge</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>Schalte Stufen frei und sammle Gems.</p>

      <div className="flex flex-col gap-4">
        {ACHIEVEMENTS.map((ach) => {
          const value = stats[ach.metric] ?? 0
          const level = tierReached(value, ach.tiers)
          const maxLevel = ach.tiers[ach.tiers.length - 1].level
          const next = nextTier(value, ach.tiers)
          const pct = next ? Math.min(100, Math.round((value / next.threshold) * 100)) : 100
          const claimedLevel = claimed[ach.id] ?? 0

          return (
            <div key={ach.id} className="flex items-center gap-4 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}>
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl"
                style={{ background: level > 0 ? '#facc1533' : 'var(--kb-key-bg)', filter: level > 0 ? 'none' : 'grayscale(0.6)' }}
              >
                {ach.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 font-extrabold">
                  {ach.title}
                  <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--kb-key-bg)', color: 'var(--text-muted)' }}>
                    Stufe {level}/{maxLevel}
                  </span>
                  {claimedLevel > 0 && <span className="text-xs text-amber-500">✓ +{ach.tiers.slice(0, claimedLevel).reduce((a, t) => a + t.gemReward, 0)} 💎 erhalten</span>}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {next ? ach.description(next.threshold) : 'Maximale Stufe erreicht!'}
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: 'var(--kb-key-bg)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#eab308' }} />
                </div>
                <div className="mt-0.5 text-right text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {value.toLocaleString('de-DE')}{next ? ` / ${next.threshold.toLocaleString('de-DE')}` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
