import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import { GridSkeleton } from '../components/ui/Skeletons';

function MiniCard({ build }) {
  return (
    <Link to={`/builds/${build.slug}`} className="card overflow-hidden group hover:border-emerald-600">
      <div className="h-28 w-full bg-slate-800 overflow-hidden">
        {build.thumbnail ? (
          <img src={build.thumbnail} alt={build.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-3xl">🧱</div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium line-clamp-1">{build.title}</p>
        <DifficultyBadge difficulty={build.difficulty} />
      </div>
    </Link>
  );
}

export default function Favorites() {
  const [favorites, setFavorites] = useState(null);
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    api.get('/users/me/favorites').then((d) => setFavorites(d.builds));
    api.get('/users/me/recently-viewed').then((d) => setRecent(d.builds));
  }, []);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold mb-4">⭐ Meine Favoriten</h1>
        {favorites === null ? (
          <GridSkeleton count={4} />
        ) : favorites.length === 0 ? (
          <p className="text-slate-500 text-sm">Noch keine Favoriten. Markiere Builds mit dem Stern-Symbol.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {favorites.map((b) => <MiniCard key={b.id} build={b} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">🕓 Zuletzt angesehen</h2>
        {recent === null ? (
          <GridSkeleton count={4} />
        ) : recent.length === 0 ? (
          <p className="text-slate-500 text-sm">Du hast noch keine Builds angesehen.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recent.map((b) => <MiniCard key={b.id} build={b} />)}
          </div>
        )}
      </section>
    </div>
  );
}
