import { useUiStore } from '../../store/uiStore';

const STYLES = {
  info: 'bg-slate-800 border-slate-700',
  success: 'bg-emerald-800/90 border-emerald-600',
  error: 'bg-red-800/90 border-red-600',
};

export default function ToastHost() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`border rounded-lg px-4 py-3 text-sm text-white shadow-lg animate-[fadeIn_0.2s_ease-out] ${STYLES[t.type] || STYLES.info}`}
          onClick={() => dismissToast(t.id)}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
