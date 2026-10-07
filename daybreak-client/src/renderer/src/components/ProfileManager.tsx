import { useState } from 'react'
import type { JSX } from 'react'
import type { JavaLoader, Profile } from '@shared/types'
import { useTranslation } from '../i18n/useTranslation'
import { useAppStore } from '../store/useAppStore'

interface NewProfileForm {
  name: string
  edition: 'java' | 'bedrock'
  minecraftVersion: string
  loader: JavaLoader
  ramMb: number
  jvmArgs: string
  channel: 'release' | 'preview'
}

const DEFAULT_FORM: NewProfileForm = {
  name: '',
  edition: 'java',
  minecraftVersion: 'latest-release',
  loader: 'vanilla',
  ramMb: 4096,
  jvmArgs: '',
  channel: 'release'
}

export function ProfileManager({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const { profiles, refreshProfiles } = useAppStore()
  const [form, setForm] = useState<NewProfileForm>(DEFAULT_FORM)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(): Promise<void> {
    setError(null)
    const input =
      form.edition === 'java'
        ? {
            name: form.name,
            edition: 'java' as const,
            minecraftVersion: form.minecraftVersion,
            loader: form.loader,
            loaderVersion: null,
            ramMb: form.ramMb,
            jvmArgs: form.jvmArgs,
            javaPath: null,
            icon: 'default'
          }
        : {
            name: form.name,
            edition: 'bedrock' as const,
            channel: form.channel,
            icon: 'default'
          }
    const result = await window.daybreak.profiles.create(input)
    if (result.ok) {
      setForm(DEFAULT_FORM)
      await refreshProfiles()
    } else {
      setError(result.error.message)
    }
  }

  async function handleDuplicate(id: string): Promise<void> {
    const result = await window.daybreak.profiles.duplicate(id)
    if (result.ok) await refreshProfiles()
    else setError(result.error.message)
  }

  async function handleDelete(id: string): Promise<void> {
    const result = await window.daybreak.profiles.remove(id)
    if (result.ok) await refreshProfiles()
    else setError(result.error.message)
  }

  async function handleExport(id: string): Promise<void> {
    const result = await window.daybreak.profiles.exportZip(id)
    if (!result.ok) setError(result.error.message)
  }

  async function handleImport(): Promise<void> {
    const result = await window.daybreak.profiles.importZip()
    if (result.ok) await refreshProfiles()
    else setError(result.error.message)
  }

  return (
    <div>
      <h2>{t('profiles.title')}</h2>
      {error && <div className="error-banner">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>{t('profiles.name')}</th>
            <th>{t('profiles.edition')}</th>
            <th>{t('profiles.version')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile: Profile) => (
            <tr key={profile.id}>
              <td>{profile.name}</td>
              <td>{profile.edition}</td>
              <td>{profile.edition === 'java' ? profile.minecraftVersion : profile.channel}</td>
              <td>
                <button type="button" onClick={() => handleDuplicate(profile.id)}>
                  {t('profiles.duplicate')}
                </button>
                {profile.edition === 'java' && (
                  <button type="button" onClick={() => handleExport(profile.id)}>
                    {t('profiles.export')}
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(profile.id)}>
                  {t('profiles.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={handleImport}>
        {t('profiles.import')}
      </button>

      <h3>{t('profiles.create')}</h3>
      <div>
        <label htmlFor="profileName">{t('profiles.name')}</label>
        <input id="profileName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label htmlFor="profileEdition">{t('profiles.edition')}</label>
        <select
          id="profileEdition"
          value={form.edition}
          onChange={(e) => setForm({ ...form, edition: e.target.value as 'java' | 'bedrock' })}
        >
          <option value="java">Java</option>
          <option value="bedrock">Bedrock</option>
        </select>
      </div>
      {form.edition === 'java' ? (
        <>
          <div>
            <label htmlFor="profileVersion">{t('profiles.version')}</label>
            <input
              id="profileVersion"
              value={form.minecraftVersion}
              onChange={(e) => setForm({ ...form, minecraftVersion: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="profileLoader">{t('profiles.loader')}</label>
            <select
              id="profileLoader"
              value={form.loader}
              onChange={(e) => setForm({ ...form, loader: e.target.value as JavaLoader })}
            >
              <option value="vanilla">Vanilla</option>
              <option value="fabric">Fabric</option>
              <option value="quilt">Quilt</option>
              <option value="forge">Forge</option>
              <option value="neoforge">NeoForge</option>
            </select>
          </div>
          <div>
            <label htmlFor="profileRam">{t('profiles.ram')}</label>
            <input
              id="profileRam"
              type="number"
              step={512}
              value={form.ramMb}
              onChange={(e) => setForm({ ...form, ramMb: Number(e.target.value) })}
            />
          </div>
          <div>
            <label htmlFor="profileJvmArgs">{t('profiles.javaArgs')}</label>
            <input
              id="profileJvmArgs"
              value={form.jvmArgs}
              onChange={(e) => setForm({ ...form, jvmArgs: e.target.value })}
            />
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="bedrockChannel">Channel</label>
          <select
            id="bedrockChannel"
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value as 'release' | 'preview' })}
          >
            <option value="release">Release</option>
            <option value="preview">Preview</option>
          </select>
        </div>
      )}
      <button type="button" onClick={handleCreate} disabled={!form.name.trim()}>
        {t('profiles.save')}
      </button>
      <button type="button" onClick={onClose}>
        {t('profiles.cancel')}
      </button>
    </div>
  )
}
