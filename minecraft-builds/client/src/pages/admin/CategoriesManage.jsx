import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useUiStore } from '../../store/uiStore';

export default function CategoriesManage() {
  const [categories, setCategories] = useState(null);
  const [tags, setTags] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [newTag, setNewTag] = useState('');
  const pushToast = useUiStore((s) => s.pushToast);

  function loadAll() {
    api.get('/categories').then((d) => setCategories(d.categories));
    api.get('/tags').then((d) => setTags(d.tags));
  }
  useEffect(loadAll, []);

  async function addCategory(e) {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      await api.post('/categories', newCategory);
      setNewCategory({ name: '', icon: '' });
      loadAll();
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm('Kategorie löschen? Builds behalten keine Kategorie mehr.')) return;
    await api.del(`/categories/${id}`);
    loadAll();
  }

  async function addTag(e) {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await api.post('/tags', { name: newTag });
      setNewTag('');
      loadAll();
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  async function deleteTag(id) {
    await api.del(`/tags/${id}`);
    loadAll();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section>
        <h2 className="text-xl font-bold mb-3">Kategorien</h2>
        <form onSubmit={addCategory} className="flex gap-2 mb-3">
          <input
            className="input !w-20 text-center"
            placeholder="🏠"
            maxLength={4}
            value={newCategory.icon}
            onChange={(e) => setNewCategory((c) => ({ ...c, icon: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Name der Kategorie"
            value={newCategory.name}
            onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))}
          />
          <button className="btn-primary shrink-0">Hinzufügen</button>
        </form>
        <div className="card divide-y divide-slate-800">
          {categories?.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 text-sm">
              <span>{c.icon} {c.name} <span className="text-slate-500">({c.build_count})</span></span>
              <button onClick={() => deleteCategory(c.id)} className="text-red-400 hover:underline text-xs">Löschen</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Tags</h2>
        <form onSubmit={addTag} className="flex gap-2 mb-3">
          <input className="input" placeholder="Neuer Tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
          <button className="btn-primary shrink-0">Hinzufügen</button>
        </form>
        <div className="card p-3 flex flex-wrap gap-2">
          {tags?.map((t) => (
            <span key={t.id} className="badge bg-slate-800 text-slate-300 gap-2">
              #{t.name}
              <button onClick={() => deleteTag(t.id)} className="text-red-400">✕</button>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
