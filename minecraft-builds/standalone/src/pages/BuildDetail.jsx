import { useEffect, useState } from 'react';
import { db } from '../store/localDb';
import { useDbVersion } from '../store/useDb';
import { useUiStore } from '../store/uiStore';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import StarRating from '../components/ui/StarRating';
import VoxelViewer from '../components/three/VoxelViewer';
import ImageStepViewer from '../components/ImageStepViewer';
import MaterialsList from '../components/MaterialsList';

const TABS = [
  { id: '3d', label: '🧊 3D-Anleitung' },
  { id: 'image', label: '🖼️ Bild-Anleitung' },
  { id: 'materials', label: '📋 Materialliste' },
  { id: 'notes', label: '📝 Bewertung & Notizen' },
];

export default function BuildDetail({ buildId, navigate }) {
  useDbVersion();
  const pushToast = useUiStore((s) => s.pushToast);
  const [tab, setTab] = useState('3d');
  const build = db.getBuild(buildId);

  useEffect(() => {
    db.incrementView(buildId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId]);

  if (!build) return <p className="text-center text-slate-500 py-16">Build nicht gefunden.</p>;

  function copyLink() {
    const url = `${window.location.href.split('#')[0]}#build=${build.slug}`;
    navigator.clipboard.writeText(url).then(
      () => pushToast('Link kopiert! (Funktioniert nur, solange diese Datei am selben Ort geöffnet wird.)', 'success'),
      () => pushToast('Kopieren nicht möglich – Link manuell markieren.', 'error'),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate({ name: 'library' })} className="text-xs text-slate-400 hover:text-emerald-400 mb-3">← Zurück zur Bibliothek</button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{build.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {build.category && <span className="badge bg-slate-800 text-slate-300">{build.category.icon} {build.category.name}</span>}
              <DifficultyBadge difficulty={build.difficulty} />
              {build.editions.map((e) => <span key={e} className="badge bg-slate-800 text-slate-300 uppercase">{e}</span>)}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => db.toggleFavorite(build.id)} className={build.favorite ? 'btn-primary' : 'btn-secondary'}>
              {build.favorite ? '★ Favorit' : '☆ Favorisieren'}
            </button>
            <button onClick={() => navigate({ name: 'editor', id: build.id })} className="btn-secondary">✏️ Bearbeiten</button>
            <button onClick={copyLink} className="btn-secondary">🔗 Teilen</button>
          </div>
        </div>
        <p className="text-slate-400 mt-3 max-w-3xl">{build.description}</p>
        {build.compatNotes && <p className="text-xs text-amber-400/90 mt-2">⚠️ Kompatibilität: {build.compatNotes}</p>}
        {build.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {build.tags.map((t) => <span key={t.id} className="badge bg-emerald-500/10 text-emerald-400">#{t.name}</span>)}
          </div>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-800">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === '3d' && (build.blocks.length > 0 ? <VoxelViewer blocks={build.blocks} /> : <p className="text-slate-500 text-sm py-8 text-center">Für diesen Build wurden noch keine Blockdaten hinterlegt.</p>)}
        {tab === 'image' && <ImageStepViewer build={build} />}
        {tab === 'materials' && <MaterialsList build={build} />}
        {tab === 'notes' && (
          <div className="space-y-6 max-w-xl">
            <div className="card p-4">
              <p className="text-sm text-slate-400 mb-2">Meine Bewertung</p>
              <StarRating value={build.myRating} onChange={(stars) => db.setRating(build.id, stars)} size="text-2xl" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Meine Notizen (nur lokal auf diesem Gerät sichtbar)</label>
              <textarea
                className="input min-h-32"
                placeholder="z.B. Änderungen, die du beim Nachbauen vornehmen willst…"
                value={build.myNotes}
                onChange={(e) => db.setNotes(build.id, e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
