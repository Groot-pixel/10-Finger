import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useUiStore } from '../../store/uiStore';

export default function BuildsManage() {
  const [builds, setBuilds] = useState(null);
  const pushToast = useUiStore((s) => s.pushToast);

  function load() {
    api.get('/builds?includeDrafts=true&sort=newest').then((d) => setBuilds(d.builds));
  }

  useEffect(load, []);

  async function remove(id, title) {
    if (!window.confirm(`"${title}" wirklich unwiderruflich löschen?`)) return;
    try {
      await api.del(`/builds/${id}`);
      setBuilds((b) => b.filter((x) => x.id !== id));
      pushToast('Build gelöscht.', 'success');
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  async function toggleStatus(build) {
    const status = build.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/builds/${build.id}`, { status });
      setBuilds((bs) => bs.map((b) => (b.id === build.id ? { ...b, status } : b)));
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Builds verwalten</h1>
        <Link to="/admin/builds/new" className="btn-primary">➕ Neuer Build</Link>
      </div>

      {builds === null ? (
        <div className="skeleton h-64 w-full" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="p-3">Titel</th>
                <th className="p-3">Kategorie</th>
                <th className="p-3">Schwierigkeit</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aufrufe</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {builds.map((b) => (
                <tr key={b.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="p-3 font-medium">{b.title}</td>
                  <td className="p-3 text-slate-400">{b.category?.name || '–'}</td>
                  <td className="p-3 text-slate-400">{b.difficulty}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleStatus(b)}
                      className={`badge cursor-pointer ${b.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}
                    >
                      {b.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </button>
                  </td>
                  <td className="p-3 text-slate-400">{b.viewCount}</td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <Link to={`/admin/builds/${b.id}`} className="text-emerald-400 hover:underline text-xs">Bearbeiten</Link>
                    <button onClick={() => remove(b.id, b.title)} className="text-red-400 hover:underline text-xs">Löschen</button>
                  </td>
                </tr>
              ))}
              {builds.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Noch keine Builds angelegt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
