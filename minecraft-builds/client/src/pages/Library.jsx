import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import BuildCard from '../components/BuildCard';
import { GridSkeleton } from '../components/ui/Skeletons';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'oldest', label: 'Älteste zuerst' },
  { value: 'popular', label: 'Beliebteste zuerst' },
  { value: 'hardest', label: 'Schwierigste zuerst' },
  { value: 'easiest', label: 'Leichteste zuerst' },
];

export default function Library() {
  const [builds, setBuilds] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', difficulty: '', tag: '', edition: '', sort: 'newest' });

  useEffect(() => {
    api.get('/categories').then((d) => setCategories(d.categories));
    api.get('/tags').then((d) => setTags(d.tags));
  }, []);

  useEffect(() => {
    setBuilds(null);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const t = setTimeout(() => {
      api.get(`/builds?${params.toString()}`).then((d) => setBuilds(d.builds));
    }, 200);
    return () => clearTimeout(t);
  }, [filters]);

  function update(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([k, v]) => k !== 'sort' && k !== 'q' && v).length,
    [filters],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Build-Bibliothek</h1>
        <p className="text-sm text-slate-400">Durchsuche alle Minecraft-Bauanleitungen nach Kategorie, Schwierigkeit und Tags.</p>
      </div>

      <div className="card p-4 mb-6 space-y-3">
        <input
          type="search"
          placeholder="🔍 Suche nach Titel oder Beschreibung…"
          className="input"
          value={filters.q}
          onChange={(e) => update('q', e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select className="input !w-auto" value={filters.category} onChange={(e) => update('category', e.target.value)}>
            <option value="">Alle Kategorien</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>
            ))}
          </select>
          <select className="input !w-auto" value={filters.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
            <option value="">Alle Schwierigkeiten</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select className="input !w-auto" value={filters.tag} onChange={(e) => update('tag', e.target.value)}>
            <option value="">Alle Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.slug}>{t.name}</option>
            ))}
          </select>
          <select className="input !w-auto" value={filters.edition} onChange={(e) => update('edition', e.target.value)}>
            <option value="">Alle Editionen</option>
            <option value="java">Java</option>
            <option value="bedrock">Bedrock</option>
            <option value="pe">PE</option>
          </select>
          <select className="input !w-auto ml-auto" value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {(activeFilterCount > 0 || filters.q) && (
            <button
              className="btn-ghost text-xs"
              onClick={() => setFilters({ q: '', category: '', difficulty: '', tag: '', edition: '', sort: filters.sort })}
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {builds === null ? (
        <GridSkeleton />
      ) : builds.length === 0 ? (
        <p className="text-center text-slate-500 py-12">Keine Builds gefunden. Passe deine Filter an.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {builds.map((b) => (
            <BuildCard key={b.id} build={b} />
          ))}
        </div>
      )}
    </div>
  );
}
