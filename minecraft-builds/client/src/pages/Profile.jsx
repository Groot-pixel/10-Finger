import { useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const pushToast = useUiStore((s) => s.pushToast);
  const [form, setForm] = useState({
    name: user.name || '',
    minecraftUsername: user.minecraftUsername || '',
    editionPref: user.editionPref || 'java',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { path } = await api.upload('/uploads/avatar', formData);
      const data = await api.put('/auth/me', { avatar: path });
      updateUser(data.user);
      pushToast('Avatar aktualisiert.', 'success');
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.put('/auth/me', form);
      updateUser(data.user);
      pushToast('Profil gespeichert.', 'success');
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mein Profil</h1>
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          className="relative h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0 group"
          title="Avatar ändern"
        >
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            user.name?.[0]?.toUpperCase()
          )}
          <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition-opacity">
            {uploadingAvatar ? '…' : '✏️'}
          </span>
        </button>
        <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
          {user.role === 'admin' && <span className="badge bg-emerald-500/20 text-emerald-400 mt-1">Admin</span>}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Minecraft-Username</label>
          <input
            className="input"
            value={form.minecraftUsername}
            onChange={(e) => setForm({ ...form, minecraftUsername: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Bevorzugte Edition</label>
          <select
            className="input"
            value={form.editionPref}
            onChange={(e) => setForm({ ...form, editionPref: e.target.value })}
          >
            <option value="java">Java</option>
            <option value="bedrock">Bedrock</option>
            <option value="pe">PE</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </form>
    </div>
  );
}
