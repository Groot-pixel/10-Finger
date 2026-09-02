import { useEffect, useState } from 'react';
import { db } from '../store/localDb';

export default function ImageStepViewer({ build }) {
  const images = build.images.length > 0 ? build.images : [];
  const [index, setIndex] = useState(Math.min(build.progress?.lastImageStep || 0, Math.max(images.length - 1, 0)));

  useEffect(() => {
    setIndex(Math.min(build.progress?.lastImageStep || 0, Math.max(images.length - 1, 0)));
  }, [build.id]);

  useEffect(() => {
    if (images.length === 0) return;
    const t = setTimeout(() => db.setProgress(build.id, { lastImageStep: index }), 400);
    return () => clearTimeout(t);
  }, [index, build.id, images.length]);

  if (images.length === 0) {
    return <p className="text-slate-500 text-sm py-8 text-center">Für diesen Build wurde noch keine Bild-Anleitung hinterlegt.</p>;
  }

  const step = images[index];
  const progressPct = ((index + 1) / images.length) * 100;

  return (
    <div className="space-y-4">
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="card overflow-hidden">
        <img src={step.dataUrl} alt={`Schritt ${index + 1}`} className="w-full max-h-[480px] object-contain bg-slate-900" />
        <div className="p-4">
          <p className="text-xs text-slate-400 mb-1">Schritt {index + 1} von {images.length}{step.auto && ' · automatisch erzeugt (Draufsicht)'}</p>
          <p className="text-sm">{step.description || 'Platziere die gezeigten Blöcke wie im Bild.'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button className="btn-secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>← Zurück</button>
        <span className="text-xs text-slate-500">Kein Zeitdruck – dein Tempo, dein Fortschritt wird gespeichert</span>
        <button className="btn-primary" disabled={index === images.length - 1} onClick={() => setIndex((i) => i + 1)}>Weiter →</button>
      </div>
    </div>
  );
}
