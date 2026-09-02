import { useState } from 'react';
import { db } from '../store/localDb';
import { useDbVersion } from '../store/useDb';

export default function CategoriesManage() {
  useDbVersion();
  const categories = db.listCategories();
  const tags = db.listTags();
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [newTag, setNewTag] = useState('');

  function addCategory(e) {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    db.addCategory(newCategory.name.trim(), newCategory.icon.trim());
    setNewCategory({ name: '', icon: '' });
  }

  function addTag(e) {
    e.preventDefault();
    if (!newTag.trim()) return;
    db.addTag(newTag.trim());
    setNewTag('');
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section>
        <h2 className="text-xl font-bold mb-3">Kategorien</h2>
        <form onSubmit={addCategory} className="flex gap-2 mb-3">
          <input className="input !w-20 text-center" placeholder="🏠" maxLength={4} value={newCategory.icon} onChange={(e) => setNewCategory((c) => ({ ...c, icon: e.target.value }))} />
          <input className="input" placeholder="Name der Kategorie" value={newCategory.name} onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))} />
          <button className="btn-primary shrink-0">Hinzufügen</button>
        </form>
        <div className="card divide-y divide-slate-800">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 text-sm">
              <span>{c.icon} {c.name} <span className="text-slate-500">({c.buildCount})</span></span>
              <button onClick={() => db.deleteCategory(c.id)} className="text-red-400 hover:underline text-xs">Löschen</button>
            </div>
          ))}
          {categories.length === 0 && <p className="p-3 text-sm text-slate-500">Keine Kategorien vorhanden.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Tags</h2>
        <form onSubmit={addTag} className="flex gap-2 mb-3">
          <input className="input" placeholder="Neuer Tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
          <button className="btn-primary shrink-0">Hinzufügen</button>
        </form>
        <div className="card p-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.id} className="badge bg-slate-800 text-slate-300 gap-2">
              #{t.name}
              <button onClick={() => db.deleteTag(t.id)} className="text-red-400">✕</button>
            </span>
          ))}
          {tags.length === 0 && <p className="text-sm text-slate-500">Keine Tags vorhanden.</p>}
        </div>
      </section>
    </div>
  );
}
