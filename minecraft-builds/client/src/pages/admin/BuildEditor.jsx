import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useUiStore } from '../../store/uiStore';
import VoxelEditor from '../../components/three/VoxelEditor';
import ImageUploader from '../../components/admin/ImageUploader';
import MaterialsList from '../../components/MaterialsList';

const EMPTY_FORM = {
  title: '',
  description: '',
  categoryId: '',
  difficulty: 'easy',
  editions: ['java'],
  compatNotes: '',
  tagIds: [],
};

export default function BuildEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);

  const [tab, setTab] = useState('meta');
  const [form, setForm] = useState(EMPTY_FORM);
  const [buildId, setBuildId] = useState(id || null);
  const [status, setStatus] = useState('draft');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then((d) => setCategories(d.categories));
    api.get('/tags').then((d) => setTags(d.tags));
  }, []);

  useEffect(() => {
    if (isNew) return;
    Promise.all([
      api.get(`/builds/id/${id}`),
      api.get(`/builds/${id}/blocks`),
      api.get(`/builds/${id}/images`),
    ])
      .then(([buildData, blocksData, imagesData]) => {
        const b = buildData.build;
        setForm({
          title: b.title,
          description: b.description,
          categoryId: b.category?.id || '',
          difficulty: b.difficulty,
          editions: b.editions,
          compatNotes: b.compatNotes,
          tagIds: b.tags.map((t) => t.id),
        });
        setStatus(b.status);
        setBlocks(blocksData.blocks.map((bl) => ({ x: bl.x, y: bl.y, z: bl.z, blockType: bl.block_type })));
        setImages(imagesData.images);
      })
      .catch((err) => pushToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleEdition(ed) {
    setForm((f) => ({
      ...f,
      editions: f.editions.includes(ed) ? f.editions.filter((e) => e !== ed) : [...f.editions, ed],
    }));
  }

  function toggleTag(tagId) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId) ? f.tagIds.filter((t) => t !== tagId) : [...f.tagIds, tagId],
    }));
  }

  async function saveMeta(newStatus) {
    if (!form.title.trim()) return pushToast('Titel ist erforderlich.', 'error');
    setSaving(true);
    try {
      const payload = { ...form, categoryId: form.categoryId || null, status: newStatus ?? status };
      if (buildId) {
        const { build } = await api.put(`/builds/${buildId}`, payload);
        setStatus(build.status);
        pushToast('Gespeichert.', 'success');
      } else {
        const { build } = await api.post('/builds', payload);
        setBuildId(build.id);
        setStatus(build.status);
        pushToast('Build angelegt – jetzt Blöcke & Bilder hinzufügen.', 'success');
        navigate(`/admin/builds/${build.id}`, { replace: true });
      }
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveBlocks() {
    if (!buildId) return;
    setSaving(true);
    try {
      await api.put(`/builds/${buildId}/blocks`, { blocks });
      pushToast('Blockdaten gespeichert.', 'success');
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="skeleton h-96 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{isNew && !buildId ? 'Neuer Build' : `Build bearbeiten: ${form.title}`}</h1>
        {buildId && (
          <span className={`badge ${status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
          </span>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-800">
        {[
          { id: 'meta', label: '📝 Metadaten' },
          { id: 'voxel', label: '🧊 Voxel-Editor', disabled: !buildId },
          { id: 'images', label: '🖼️ Bild-Anleitung', disabled: !buildId },
          { id: 'materials', label: '📋 Materialliste', disabled: !buildId },
        ].map((t) => (
          <button
            key={t.id}
            disabled={t.disabled}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === t.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
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
                <button
                  key={ed}
                  type="button"
                  onClick={() => toggleEdition(ed)}
                  className={form.editions.includes(ed) ? 'btn-primary !py-1.5' : 'btn-secondary !py-1.5'}
                >
                  {ed.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Kompatibilitätshinweis (Shader/Texture-Packs, Blocknamen)</label>
            <input className="input" value={form.compatNotes} onChange={(e) => update('compatNotes', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={`badge border ${form.tagIds.includes(t.id) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-secondary" disabled={saving} onClick={() => saveMeta('draft')}>
              Als Entwurf speichern
            </button>
            <button className="btn-primary" disabled={saving} onClick={() => saveMeta('published')}>
              Speichern & veröffentlichen
            </button>
          </div>
        </div>
      )}

      {tab === 'voxel' && buildId && (
        <div className="space-y-3">
          <VoxelEditor initialBlocks={blocks} onChange={setBlocks} />
          <button className="btn-primary" disabled={saving} onClick={saveBlocks}>
            {saving ? 'Speichern…' : '💾 Blockdaten speichern'}
          </button>
        </div>
      )}

      {tab === 'images' && buildId && (
        <ImageUploader buildId={buildId} images={images} setImages={setImages} />
      )}

      {tab === 'materials' && buildId && (
        <MaterialsList buildId={buildId} buildTitle={form.title || 'Build'} />
      )}
    </div>
  );
}
