import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    minecraftUsername: '',
    editionPref: 'java',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/register', form);
      setSession(data.token, data.user);
      pushToast(`Account erstellt – willkommen, ${data.user.name}!`, 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-1">Registrieren</h1>
      <p className="text-sm text-slate-400 mb-6">Der erste registrierte Account wird automatisch Admin.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Name</label>
          <input required className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">E-Mail</label>
          <input type="email" required className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Passwort (min. 6 Zeichen)</label>
          <input
            type="password"
            required
            minLength={6}
            className="input"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Minecraft-Username (optional)</label>
          <input className="input" value={form.minecraftUsername} onChange={(e) => update('minecraftUsername', e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Bevorzugte Edition</label>
          <select className="input" value={form.editionPref} onChange={(e) => update('editionPref', e.target.value)}>
            <option value="java">Java</option>
            <option value="bedrock">Bedrock</option>
            <option value="pe">PE</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Wird erstellt…' : 'Account erstellen'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Schon registriert?{' '}
        <Link to="/login" className="text-emerald-400 hover:underline">Anmelden</Link>
      </p>
    </div>
  );
}
