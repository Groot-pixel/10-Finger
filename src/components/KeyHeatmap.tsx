import { KEY_ROWS } from '../data/keyboard'
import type { KeyStat } from '../types'

/** error rate → colour: green (sicher) … red (viele Fehler); grey = noch nicht geübt */
function heat(stat: KeyStat | undefined): { bg: string; fg: string; label: string } {
  if (!stat || stat.attempts < 3) return { bg: 'var(--kb-key-bg)', fg: 'var(--text-muted)', label: 'noch nicht geübt' }
  const rate = stat.errors / stat.attempts
  const pct = `${Math.round(rate * 100)}% Fehler`
  if (rate > 0.2) return { bg: '#ff4b4b', fg: '#fff', label: pct }
  if (rate > 0.1) return { bg: '#e68743', fg: '#fff', label: pct }
  if (rate > 0.04) return { bg: '#f0b45a', fg: '#4b3a00', label: pct }
  return { bg: '#2fb9a8', fg: '#fff', label: pct }
}

/** a small keyboard where every key is coloured by how often it was mistyped */
export default function KeyHeatmap({ keyStats }: { keyStats: Record<string, KeyStat> }) {
  return (
    <div className="tile p-3 sm:p-4">
      <div className="flex flex-col gap-1 sm:gap-1.5">
        {KEY_ROWS.map((row, i) => (
          <div key={i} className="flex gap-1 sm:gap-1.5" style={{ paddingLeft: `${i * 2.4}%` }}>
            {row.map((k) => {
              const h = heat(keyStats[k.base])
              return (
                <div
                  key={k.base}
                  title={`${k.base.toUpperCase()}: ${h.label}`}
                  className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-md text-[10px] font-extrabold sm:h-10 sm:rounded-lg sm:text-xs"
                  style={{ background: h.bg, color: h.fg, boxShadow: '0 2px 0 rgba(0,0,0,.12)' }}
                >
                  {k.base === 'ß' ? 'ß' : k.base.toUpperCase()}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
        {[
          ['#2fb9a8', 'sicher'],
          ['#f0b45a', 'ein paar Fehler'],
          ['#e68743', 'üben'],
          ['#ff4b4b', 'viele Fehler'],
          ['var(--kb-key-bg)', 'noch nicht geübt'],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded" style={{ background: c, border: '1px solid var(--border)' }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}
