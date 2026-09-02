import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-1">Passwort vergessen</h1>
      <p className="text-sm text-slate-400 mb-6">
        Diese App versendet keine echten E-Mails (kostenloses Self-Hosting für Freunde). Der Reset-Link wird
        direkt hier angezeigt.
      </p>
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="deine@email.de"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Erzeugen…' : 'Reset-Link erzeugen'}
          </button>
        </form>
      ) : (
        <div className="card p-4 space-y-3">
          <p className="text-sm">{result.message}</p>
          {result.resetUrl && (
            <Link to={result.resetUrl} className="btn-primary w-full">
              Zum Zurücksetzen
            </Link>
          )}
        </div>
      )}
      <Link to="/login" className="block mt-4 text-sm text-emerald-400 hover:underline">
        Zurück zum Login
      </Link>
    </div>
  );
}
