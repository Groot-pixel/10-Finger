import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import StarRating from './ui/StarRating';

export default function CommentsSection({ buildId, myRating, ratingSummary, onRatingChange }) {
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    api.get(`/builds/${buildId}/comments`).then((d) => setComments(d.comments));
  }, [buildId]);

  async function submitRating(stars) {
    try {
      const data = await api.post(`/builds/${buildId}/rating`, { stars });
      onRatingChange?.(stars, data.rating);
      pushToast('Bewertung gespeichert.', 'success');
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const data = await api.post(`/builds/${buildId}/comments`, { text });
      setComments((c) => [data.comment, ...c]);
      setText('');
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(id) {
    try {
      await api.del(`/builds/${buildId}/comments/${id}`);
      setComments((c) => c.filter((cm) => cm.id !== id));
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-slate-400 mb-1">Durchschnitt</p>
          <div className="flex items-center gap-2">
            <StarRating value={ratingSummary?.average || 0} readOnly size="text-xl" />
            <span className="text-sm text-slate-400">
              {ratingSummary?.average || 0} ({ratingSummary?.count || 0} Bewertungen)
            </span>
          </div>
        </div>
        {user ? (
          <div>
            <p className="text-sm text-slate-400 mb-1 text-right">Deine Bewertung</p>
            <StarRating value={myRating || 0} onChange={submitRating} size="text-xl" />
          </div>
        ) : (
          <p className="text-xs text-slate-500">Anmelden, um zu bewerten</p>
        )}
      </div>

      {user && (
        <form onSubmit={submitComment} className="flex gap-2">
          <input
            className="input"
            placeholder="Kommentar schreiben…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-primary shrink-0" disabled={posting}>Senden</button>
        </form>
      )}

      <div className="space-y-3">
        {comments === null ? (
          <div className="skeleton h-16 w-full" />
        ) : comments.length === 0 ? (
          <p className="text-slate-500 text-sm">Noch keine Kommentare. Sei der Erste!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                    {c.user_avatar ? <img src={c.user_avatar} alt="" className="h-full w-full object-cover" /> : c.user_name?.[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">{c.user_name}</span>
                  <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString('de-DE')}</span>
                </div>
                {user && (user.id === c.user_id || user.role === 'admin') && (
                  <button onClick={() => deleteComment(c.id)} className="text-xs text-red-400 hover:underline">
                    Löschen
                  </button>
                )}
              </div>
              <p className="text-sm mt-2 text-slate-300">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
