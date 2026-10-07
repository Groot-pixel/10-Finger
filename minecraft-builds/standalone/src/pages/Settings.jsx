import { useRef, useState } from 'react';
import { db } from '../store/localDb';
import { useDbVersion } from '../store/useDb';
import { useUiStore } from '../store/uiStore';

export default function Settings() {
  useDbVersion();
  const pushToast = useUiStore((s) => s.pushToast);
  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState('merge');
  const state = db.getState();

  function handleExport() {
    const json = db.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `craftguide-builds-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Builds exportiert.', 'success');
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        db.importJson(reader.result, { merge: importMode === 'merge' });
        pushToast(importMode === 'merge' ? 'Builds importiert und zusammengeführt.' : 'Builds ersetzt.', 'success');
      } catch (err) {
        pushToast('Datei konnte nicht gelesen werden: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleResetSeed() {
    if (!window.confirm('Alle eigenen Builds werden gelöscht und durch die 3 Beispiel-Builds ersetzt. Fortfahren?')) return;
    db.resetAll();
    pushToast('Zurückgesetzt auf Beispieldaten.', 'success');
  }

  const sizeKb = Math.round(new Blob([db.exportJson()]).size / 1024);

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Einstellungen & Daten</h1>
        <p className="text-sm text-slate-400">
          Diese App speichert alles ausschließlich lokal in diesem Browser ({state.builds.length} Builds, ca. {sizeKb} KB). Es gibt keinen
          Server und keine Cloud-Synchronisierung.
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">📤 Builds exportieren</h2>
        <p className="text-sm text-slate-400">
          Speichert alle deine Builds (inkl. Blockdaten und Bildern) als JSON-Datei. So kannst du deine Builds an Freunde weitergeben – sie
          importieren die Datei in ihrer eigenen CraftGuide-Datei.
        </p>
        <button className="btn-primary" onClick={handleExport}>⬇ Als JSON-Datei herunterladen</button>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">📥 Builds importieren</h2>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} /> Zusammenführen (bestehende Builds behalten)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} /> Ersetzen (alles überschreiben)
          </label>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>📂 JSON-Datei auswählen</button>
        <p className="text-xs text-slate-500">
          Hinweis: „Zusammenführen" fügt Builds immer als Kopie hinzu, auch wenn sie inhaltlich bereits existieren (z.B. die 3
          Beispiel-Builds) – Duplikate kannst du danach einfach über „Build löschen" entfernen. Kategorien und Tags mit gleichem Namen
          werden dagegen automatisch zusammengeführt.
        </p>
      </div>

      <div className="card p-4 space-y-3 border-red-900/50">
        <h2 className="font-semibold text-red-400">⚠️ Zurücksetzen</h2>
        <p className="text-sm text-slate-400">Löscht alle eigenen Builds und stellt die 3 Beispiel-Builds wieder her.</p>
        <button className="btn-danger" onClick={handleResetSeed}>Auf Beispieldaten zurücksetzen</button>
      </div>
    </div>
  );
}
