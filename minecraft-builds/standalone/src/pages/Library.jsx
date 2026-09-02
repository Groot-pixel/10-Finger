import { useState } from 'react';
import { db } from '../store/localDb';
import { useDbVersion } from '../store/useDb';
import BuildCard from '../components/BuildCard';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'oldest', label: 'Älteste zuerst' },
  { value: 'popular', label: 'Beliebteste zuerst' },
  { value: 'hardest', label: 'Schwierigste zuerst' },
  { value: 'easiest', label: 'Leichteste zuerst' },
];

export default function Library({ navigate }) {
  useDbVersion();
  const categories = db.listCategories();
  const tags = db.listTags();
  const [filters, setFilters] = useState({ q: '', category: '', difficulty: '', tag: '', edition: '', sort: 'newest' });

  const builds = db.listBuilds({ ...filters, includeDrafts: true });

  function update(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }
  const hasActiveFilters = Object.entries(filters).some(([k, v]) => k !== 'sort' && v);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Build-Bibliothek</h1>
          <p className="text-sm text-slate-400">Alle Builds sind lokal in diesem Browser gespeichert.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate({ name: 'editor', id: null })}>➕ Neuer Build</button>
      </div>

      <div className="card p-4 mb-6 space-y-3">
        <input type="search" placeholder="🔍 Suche nach Titel oder Beschreibung…" className="input" value={filters.q} onChange={(e) => update('q', e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <select className="input !w-auto" value={filters.category} onChange={(e) => update('category', e.target.value)}>
            <option value="">Alle Kategorien</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>)}
          </select>
          <select className="input !w-auto" value={filters.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
            <option value="">Alle Schwierigkeiten</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select className="input !w-auto" value={filters.tag} onChange={(e) => update('tag', e.target.value)}>
            <option value="">Alle Tags</option>
            {tags.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
          </select>
          <select className="input !w-auto" value={filters.edition} onChange={(e) => update('edition', e.target.value)}>
            <option value="">Alle Editionen</option>
            <option value="java">Java</option>
            <option value="bedrock">Bedrock</option>
            <option value="pe">PE</option>
          </select>
          <select className="input !w-auto ml-auto" value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasActiveFilters && (
            <button className="btn-ghost text-xs" onClick={() => setFilters({ q: '', category: '', difficulty: '', tag: '', edition: '', sort: filters.sort })}>
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {builds.length === 0 ? (
        <p className="text-center text-slate-500 py-12">Keine Builds gefunden. Passe deine Filter an oder lege einen neuen Build an.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {builds.map((b) => <BuildCard key={b.id} build={b} onOpen={(id) => navigate({ name: 'detail', id })} />)}
        </div>
      )}
    </div>
  );
}
