import { db } from '../store/localDb';
import { useDbVersion } from '../store/useDb';
import BuildCard from '../components/BuildCard';

export default function Favorites({ navigate }) {
  useDbVersion();
  const favorites = db.listFavorites();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">⭐ Meine Favoriten</h1>
      {favorites.length === 0 ? (
        <p className="text-slate-500 text-sm">Noch keine Favoriten. Markiere Builds mit dem Stern-Symbol auf der Detailseite.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((b) => <BuildCard key={b.id} build={b} onOpen={(id) => navigate({ name: 'detail', id })} />)}
        </div>
      )}
    </div>
  );
}
