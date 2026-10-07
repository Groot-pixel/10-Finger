import DifficultyBadge from './ui/DifficultyBadge';

export default function BuildCard({ build, onOpen }) {
  return (
    <button onClick={() => onOpen(build.id)} className="card overflow-hidden group hover:border-emerald-600 transition-colors text-left">
      <div className="h-36 w-full overflow-hidden bg-slate-800">
        {build.thumbnail ? (
          <img src={build.thumbnail} alt={build.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl">🧱</div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{build.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {build.category && <span className="flex items-center gap-1">{build.category.icon} {build.category.name}</span>}
        </div>
        <div className="flex items-center justify-between pt-1">
          <DifficultyBadge difficulty={build.difficulty} />
          <div className="flex items-center gap-1.5">
            {build.status === 'draft' && <span className="badge bg-amber-500/20 text-amber-400">Entwurf</span>}
            {build.favorite && <span className="text-amber-400 text-xs">★</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
