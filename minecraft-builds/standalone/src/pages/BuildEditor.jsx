import { useState } from 'react';
import { db } from '../store/localDb';
import { useDbVersion } from '../store/useDb';
import { useUiStore } from '../store/uiStore';
import VoxelEditor from '../components/three/VoxelEditor';
import ImageUploader from '../components/admin/ImageUploader';
import MaterialsList from '../components/MaterialsList';

export default function BuildEditor({ buildId, navigate }) {
  useDbVersion();
  const pushToast = useUiStore((s) => s.pushToast);
  const categories = db.listCategories();
  const tags = db.listTags();
  const existing = buildId ? db.getBuild(buildId) : null;

  const [tab, setTab] = useState('meta');
  const [currentId, setCurrentId] = useState(buildId || null);
  const [form, setForm] = useState(() => ({
    title: existing?.title || '',
    description: existing?.description || '',
    categoryId: existing?.categoryId || '',
    difficulty: existing?.difficulty || 'easy',
    editions: existing?.editions || ['java'],
    compatNotes: existing?.compatNotes || '',
    tagIds: existing?.tagIds || [],
  }));

  const build = currentId ? db.getBuild(currentId) : null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function toggleEdition(ed) {
    setForm((f) => ({ ...f, editions: f.editions.includes(ed) ? f.editions.filter((e) => e !== ed) : [...f.editions, ed] }));
  }
  function toggleTag(tagId) {
    setForm((f) => ({ ...f, tagIds: f.tagIds.includes(tagId) ? f.tagIds.filter((t) => t !== tagId) : [...f.tagIds, tagId] }));
  }

  function saveMeta(status) {
    if (!form.title.trim()) return pushToast('Titel ist erforderlich.', 'error');
    const payload = { ...form, categoryId: form.categoryId || null, status };
    if (currentId) {
      db.updateBuild(currentId, payload);
      pushToast('Gespeichert.', 'success');
    } else {
      const created = db.createBuild(payload);
      setCurrentId(created.id);
      pushToast('Build angelegt – jetzt Blöcke & Bilder hinzufügen.', 'success');
      navigate({ name: 'editor', id: created.id }, { replace: true });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{!currentId ? 'Neuer Build' : `Build bearbeiten: ${form.title}`}</h1>
        {build && (
          <span className={`badge ${build.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {build.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
          </span>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-800">
        {[
          { id: 'meta', label: '📝 Metadaten' },
          { id: 'voxel', label: '🧊 Voxel-Editor', disabled: !currentId },
          { id: 'images', label: '🖼️ Bild-Anleitung', disabled: !currentId },
          { id: 'materials', label: '📋 Materialliste', disabled: !currentId },
        ].map((t) => (
          <button key={t.id} disabled={t.disabled} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 disabled:opacity-40 disabled:cursor-not-allowed ${tab === t.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'meta' && (
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Titel</label>
            <input className="input" value={form.title} onChange={(e) => update('title', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Beschreibung</label>
            <textarea className="input min-h-24" value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Kategorie</label>
              <select className="input" value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
                <option value="">– Keine –</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Schwierigkeit</label>
              <select className="input" value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Unterstützte Editionen</label>
            <div className="flex gap-2">
              {['java', 'bedrock', 'pe'].map((ed) => (
                <button key={ed} type="button" onClick={() => toggleEdition(ed)} className={form.editions.includes(ed) ? 'btn-primary !py-1.5' : 'btn-secondary !py-1.5'}>
                  {ed.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Kompatibilitätshinweis</label>
            <input className="input" value={form.compatNotes} onChange={(e) => update('compatNotes', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`badge border ${form.tagIds.includes(t.id) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-secondary" onClick={() => saveMeta('draft')}>Als Entwurf speichern</button>
            <button className="btn-primary" onClick={() => saveMeta('published')}>Speichern & veröffentlichen</button>
            {currentId && (
              <button
                className="btn-danger ml-auto"
                onClick={() => {
                  if (window.confirm(`"${form.title}" wirklich löschen?`)) {
                    db.deleteBuild(currentId);
                    navigate({ name: 'builds' });
                  }
                }}
              >
                Build löschen
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'voxel' && build && (
        <VoxelEditor initialBlocks={build.blocks} onChange={(blocks) => db.setBlocks(build.id, blocks)} />
      )}

      {tab === 'images' && build && <ImageUploader build={build} />}

      {tab === 'materials' && build && <MaterialsList build={build} />}
    </div>
  );
}
