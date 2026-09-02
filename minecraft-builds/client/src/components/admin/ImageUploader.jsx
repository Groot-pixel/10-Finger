import { useRef, useState } from 'react';
import { api } from '../../api/client';
import { useUiStore } from '../../store/uiStore';

export default function ImageUploader({ buildId, images, setImages }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dragIndex = useRef(null);
  const fileInputRef = useRef(null);
  const pushToast = useUiStore((s) => s.pushToast);

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const { paths } = await api.upload('/uploads/multiple', formData);
      const created = [];
      for (const p of paths) {
        const { image } = await api.post(`/builds/${buildId}/images`, { imagePath: p });
        created.push(image);
      }
      setImages((prev) => [...prev, ...created]);
      pushToast(`${created.length} Bild(er) hochgeladen.`, 'success');
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  async function persistOrder(newImages) {
    setImages(newImages);
    await api
      .put(`/builds/${buildId}/images/reorder`, {
        order: newImages.map((img, i) => ({ id: img.id, stepNumber: i + 1 })),
      })
      .catch((err) => pushToast(err.message, 'error'));
  }

  function onCardDragStart(index) {
    dragIndex.current = index;
  }
  function onCardDrop(index) {
    if (dragIndex.current === null || dragIndex.current === index) return;
    const next = [...images];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    dragIndex.current = null;
    persistOrder(next);
  }

  async function updateDescription(id, description) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, description } : img)));
    await api.put(`/builds/${buildId}/images/${id}`, { description }).catch(() => {});
  }

  async function removeImage(id) {
    await api.del(`/builds/${buildId}/images/${id}`);
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-3xl mb-2">📤</p>
        <p className="text-sm text-slate-400">
          {uploading ? 'Wird hochgeladen…' : 'Bilder hierher ziehen oder klicken zum Auswählen'}
        </p>
        <p className="text-xs text-slate-600 mt-1">PNG, JPG, WEBP oder GIF, max. 8MB pro Bild</p>
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Reihenfolge per Drag & Drop sortieren</p>
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => onCardDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onCardDrop(index)}
              className="card p-2 flex items-center gap-3 cursor-move"
            >
              <span className="text-slate-500 text-xs w-6 text-center shrink-0">#{index + 1}</span>
              <img src={img.image_path} alt="" className="h-16 w-16 object-cover rounded shrink-0" />
              <input
                className="input flex-1"
                placeholder="Beschreibung für diesen Schritt…"
                value={img.description || ''}
                onChange={(e) => updateDescription(img.id, e.target.value)}
              />
              <button onClick={() => removeImage(img.id)} className="text-red-400 hover:underline text-xs shrink-0">
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
