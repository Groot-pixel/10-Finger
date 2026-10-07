import { Link } from 'react-router-dom';
import DifficultyBadge from './ui/DifficultyBadge';

export default function BuildCard({ build }) {
  return (
    <Link
      to={`/builds/${build.slug}`}
      className="card overflow-hidden group hover:border-emerald-600 transition-colors"
    >
      <div className="h-36 w-full overflow-hidden bg-slate-800">
        {build.thumbnail ? (
          <img
            src={build.thumbnail}
            alt={build.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl">🧱</div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{build.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {build.category && (
            <span className="flex items-center gap-1">
              {build.category.icon} {build.category.name}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <DifficultyBadge difficulty={build.difficulty} />
          {build.rating?.count > 0 && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              ★ {build.rating.average}
              <span className="text-slate-500">({build.rating.count})</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
