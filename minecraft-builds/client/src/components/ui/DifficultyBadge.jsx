const CONFIG = {
  easy: { label: 'Easy', className: 'bg-emerald-500/20 text-emerald-400' },
  medium: { label: 'Medium', className: 'bg-amber-500/20 text-amber-400' },
  hard: { label: 'Hard', className: 'bg-red-500/20 text-red-400' },
};

export default function DifficultyBadge({ difficulty }) {
  const cfg = CONFIG[difficulty] || CONFIG.easy;
  return <span className={`badge ${cfg.className}`}>{cfg.label}</span>;
}
