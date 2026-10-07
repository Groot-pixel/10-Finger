import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(setStats);
  }, []);

  if (!stats) return <div className="skeleton h-64 w-full" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Statistik-Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Nutzer" value={stats.userCount} />
        <StatCard label="Veröffentlichte Builds" value={stats.buildCount} />
        <StatCard label="Entwürfe" value={stats.draftCount} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-3">👀 Meistgesehen</h2>
          <ul className="space-y-2 text-sm">
            {stats.mostViewed.map((b) => (
              <li key={b.id} className="flex justify-between">
                <Link to={`/builds/${b.slug}`} className="hover:underline truncate">{b.title}</Link>
                <span className="text-slate-500">{b.view_count}</span>
              </li>
            ))}
            {stats.mostViewed.length === 0 && <li className="text-slate-500">Noch keine Aufrufe.</li>}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-3">⭐ Beliebteste</h2>
          <ul className="space-y-2 text-sm">
            {stats.mostPopular.map((b) => (
              <li key={b.id} className="flex justify-between">
                <Link to={`/builds/${b.slug}`} className="hover:underline truncate">{b.title}</Link>
                <span className="text-amber-400">{Math.round(b.avg_stars * 10) / 10}★</span>
              </li>
            ))}
            {stats.mostPopular.length === 0 && <li className="text-slate-500">Noch keine Bewertungen.</li>}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-3">🆕 Zuletzt hinzugefügt</h2>
          <ul className="space-y-2 text-sm">
            {stats.recentBuilds.map((b) => (
              <li key={b.id} className="flex justify-between">
                <Link to={`/admin/builds/${b.id}`} className="hover:underline truncate">{b.title}</Link>
                <span className={`text-xs ${b.status === 'draft' ? 'text-amber-400' : 'text-emerald-400'}`}>{b.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
