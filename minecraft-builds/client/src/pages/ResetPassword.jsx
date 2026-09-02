import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useUiStore } from '../store/uiStore';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pushToast = useUiStore((s) => s.pushToast);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      pushToast('Passwort erfolgreich zurückgesetzt. Bitte anmelden.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-sm mx-auto mt-8 text-sm text-slate-400">
        Kein Reset-Token gefunden. <Link to="/forgot-password" className="text-emerald-400 hover:underline">Neu anfordern</Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Neues Passwort setzen</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          required
          minLength={6}
          placeholder="Neues Passwort"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Speichern…' : 'Passwort speichern'}
        </button>
      </form>
    </div>
  );
}
