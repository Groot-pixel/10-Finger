import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import VoxelViewer from '../components/three/VoxelViewer';
import ImageStepViewer from '../components/ImageStepViewer';
import MaterialsList from '../components/MaterialsList';
import CommentsSection from '../components/CommentsSection';
import { LineSkeleton } from '../components/ui/Skeletons';

const TABS = [
  { id: '3d', label: '🧊 3D-Anleitung' },
  { id: 'image', label: '🖼️ Bild-Anleitung' },
  { id: 'materials', label: '📋 Materialliste' },
  { id: 'comments', label: '💬 Bewertung & Kommentare' },
];

export default function BuildDetail() {
  const { slug } = useParams();
  const [build, setBuild] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [images, setImages] = useState([]);
  const [tab, setTab] = useState('3d');
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    setBuild(null);
    setError('');
    api
      .get(`/builds/${slug}`)
      .then((d) => {
        setBuild(d.build);
        return Promise.all([
          api.get(`/builds/${d.build.id}/blocks`),
          api.get(`/builds/${d.build.id}/images`),
        ]);
      })
      .then(([blocksData, imagesData]) => {
        if (blocksData) setBlocks(blocksData.blocks);
        if (imagesData) setImages(imagesData.images);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  async function toggleFavorite() {
    if (!user) return pushToast('Bitte zuerst anmelden.', 'error');
    try {
      if (build.isFavorite) {
        await api.del(`/builds/${build.id}/favorite`);
      } else {
        await api.post(`/builds/${build.id}/favorite`);
      }
      setBuild((b) => ({ ...b, isFavorite: !b.isFavorite }));
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    pushToast('Link kopiert!', 'success');
  }

  if (error) return <p className="text-center text-red-400 py-16">{error}</p>;

  if (!build) {
    return (
      <div className="space-y-4">
        <LineSkeleton className="w-1/3" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{build.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {build.category && <span className="badge bg-slate-800 text-slate-300">{build.category.icon} {build.category.name}</span>}
              <DifficultyBadge difficulty={build.difficulty} />
              {build.editions.map((e) => (
                <span key={e} className="badge bg-slate-800 text-slate-300 uppercase">{e}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleFavorite} className={build.isFavorite ? 'btn-primary' : 'btn-secondary'}>
              {build.isFavorite ? '★ Favorit' : '☆ Favorisieren'}
            </button>
            <button onClick={copyLink} className="btn-secondary">🔗 Teilen</button>
          </div>
        </div>
        <p className="text-slate-400 mt-3 max-w-3xl">{build.description}</p>
        {build.compatNotes && (
          <p className="text-xs text-amber-400/90 mt-2">⚠️ Kompatibilität: {build.compatNotes}</p>
        )}
        {build.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {build.tags.map((t) => (
              <span key={t.id} className="badge bg-emerald-500/10 text-emerald-400">#{t.name}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === '3d' &&
          (blocks.length > 0 ? (
            <VoxelViewer blocks={blocks} />
          ) : (
            <p className="text-slate-500 text-sm py-8 text-center">Für diesen Build wurden noch keine Blockdaten hinterlegt.</p>
          ))}
        {tab === 'image' && (
          <ImageStepViewer buildId={build.id} images={images} initialStep={(build.progress?.last_image_step || 1) - 1} />
        )}
        {tab === 'materials' && <MaterialsList buildId={build.id} buildTitle={build.title} />}
        {tab === 'comments' && (
          <CommentsSection
            buildId={build.id}
            myRating={build.myRating}
            ratingSummary={build.rating}
            onRatingChange={(stars, rating) => setBuild((b) => ({ ...b, myRating: stars, rating }))}
          />
        )}
      </div>
    </div>
  );
}
