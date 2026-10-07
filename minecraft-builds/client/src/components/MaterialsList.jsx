import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function MaterialsList({ buildId, buildTitle }) {
  const [data, setData] = useState(null);
  const editionPref = useAuthStore((s) => s.user?.editionPref) || 'java';

  useEffect(() => {
    api.get(`/builds/${buildId}/materials`).then(setData);
  }, [buildId]);

  if (!data) return <div className="skeleton h-40 w-full" />;
  if (data.materials.length === 0) {
    return <p className="text-slate-500 text-sm py-8 text-center">Für diesen Build wurden noch keine Blockdaten hinterlegt.</p>;
  }

  function downloadText() {
    const lines = [
      `Materialliste: ${buildTitle}`,
      '='.repeat(40),
      '',
      ...data.materials.map(
        (m) => `${String(m.count).padStart(4)}x  ${m.nameJava} (Bedrock: ${m.nameBedrock})`,
      ),
      '',
      `Gesamt: ${data.totalBlocks} Blöcke`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materialliste-${buildTitle.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Gesamt: {data.totalBlocks} Blöcke · bevorzugte Edition: {editionPref}</p>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={downloadText}>⬇ Als Text</button>
          <button className="btn-secondary text-xs" onClick={() => window.print()}>⬇ Als PDF (drucken)</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-800">
              <th className="p-3">Anzahl</th>
              <th className="p-3">Block (Java)</th>
              <th className="p-3">Block (Bedrock)</th>
              <th className="p-3">Stacks</th>
            </tr>
          </thead>
          <tbody>
            {data.materials.map((m) => (
              <tr key={m.blockType} className="border-b border-slate-800/60 last:border-0">
                <td className="p-3 font-medium">{m.count}x</td>
                <td className="p-3">{m.nameJava}</td>
                <td className="p-3 text-slate-400">{m.nameBedrock}</td>
                <td className="p-3 text-slate-400">
                  {m.stacks > 0 ? `${m.stacks} Stack${m.stacks > 1 ? 's' : ''}${m.remainder ? ` + ${m.remainder}` : ''}` : m.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
