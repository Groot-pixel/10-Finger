import { useStore } from '../store/useStore'

const TONE_BG: Record<string, string> = {
  success: 'var(--primary)',
  info: 'var(--accent)',
  warning: '#f59e0b',
  achievement: '#eab308',
}

export default function ToastHost() {
  const toasts = useStore((s) => s.toasts)
  const dismissToast = useStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed right-3 top-16 z-[90] flex w-[min(92vw,340px)] flex-col gap-2 sm:right-5 sm:top-20">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className="toast-in pointer-events-auto flex cursor-pointer items-start gap-3 rounded-xl border p-3 shadow-lg"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderLeft: `5px solid ${TONE_BG[t.tone]}` }}
        >
          <span className="text-2xl">{t.icon}</span>
          <div className="flex flex-col">
            <span className="text-sm font-bold">{t.title}</span>
            {t.subtitle && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.subtitle}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
