import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-6xl mb-4">🧱</p>
      <h1 className="text-2xl font-bold mb-2">Seite nicht gefunden</h1>
      <Link to="/" className="text-emerald-400 hover:underline">Zurück zur Bibliothek</Link>
    </div>
  );
}
