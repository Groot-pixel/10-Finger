import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { InstalledMod, ModSearchResult, ModVersionOption } from '@shared/types'
import { useTranslation } from '../i18n/useTranslation'
import { useAppStore } from '../store/useAppStore'

export function ModsPage(): JSX.Element {
  const { t } = useTranslation()
  const { profiles, activeProfileId, setActiveProfileId } = useAppStore()
  const [platform, setPlatform] = useState<'modrinth' | 'curseforge'>('modrinth')
  const [curseforgeEnabled, setCurseforgeEnabled] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ModSearchResult[]>([])
  const [installed, setInstalled] = useState<InstalledMod[]>([])
  const [versionsByProject, setVersionsByProject] = useState<Record<string, ModVersionOption[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [updatable, setUpdatable] = useState<InstalledMod[]>([])

  const javaProfiles = profiles.filter((p) => p.edition === 'java')

  useEffect(() => {
    void window.daybreak.mods.isCurseForgeEnabled().then(setCurseforgeEnabled)
  }, [])

  useEffect(() => {
    void refreshInstalled()
  }, [activeProfileId])

  async function refreshInstalled(): Promise<void> {
    const result = await window.daybreak.mods.listInstalled(activeProfileId)
    if (result.ok) setInstalled(result.data)
  }

  async function handleSearch(): Promise<void> {
    setError(null)
    const result = await window.daybreak.mods.search({
      platform,
      query,
      minecraftVersion: null,
      loader: null,
      category: null,
      sortBy: 'relevance',
      offset: 0,
      limit: 20
    })
    if (result.ok) setResults(result.data)
    else setError(result.error.message)
  }

  async function handleLoadVersions(mod: ModSearchResult): Promise<void> {
    const result = await window.daybreak.mods.listVersions(mod.platform, mod.projectId, activeProfileId)
    if (result.ok) {
      setVersionsByProject((prev) => ({ ...prev, [mod.projectId]: result.data }))
    } else {
      setError(result.error.message)
    }
  }

  async function handleInstall(version: ModVersionOption): Promise<void> {
    setError(null)
    if (!version.distributionAllowed) {
      await window.daybreak.app.openExternal(version.projectUrl)
      setError(t('mods.distributionBlocked'))
      return
    }
    const result = await window.daybreak.mods.install(
      activeProfileId,
      version.platform,
      version.projectId,
      version.versionId
    )
    if (result.ok) await refreshInstalled()
    else setError(result.error.message)
  }

  async function handleToggle(mod: InstalledMod): Promise<void> {
    const result = await window.daybreak.mods.toggle(activeProfileId, mod.id, !mod.enabled)
    if (result.ok) await refreshInstalled()
    else setError(result.error.message)
  }

  async function handleRemove(mod: InstalledMod): Promise<void> {
    const result = await window.daybreak.mods.remove(activeProfileId, mod.id)
    if (result.ok) await refreshInstalled()
    else setError(result.error.message)
  }

  async function handleAddManual(): Promise<void> {
    const result = await window.daybreak.mods.addManual(activeProfileId)
    if (result.ok) await refreshInstalled()
    else setError(result.error.message)
  }

  async function handleCheckUpdates(): Promise<void> {
    const result = await window.daybreak.mods.checkUpdates(activeProfileId)
    if (result.ok) setUpdatable(result.data)
    else setError(result.error.message)
  }

  async function handleUpdateAll(): Promise<void> {
    const result = await window.daybreak.mods.updateAll(activeProfileId)
    if (result.ok) {
      setUpdatable([])
      await refreshInstalled()
    } else {
      setError(result.error.message)
    }
  }

  async function handleImportModpack(): Promise<void> {
    const result = await window.daybreak.mods.importModpack()
    if (!result.ok) setError(result.error.message)
  }

  return (
    <section>
      <h1>{t('mods.title')}</h1>
      {error && <div className="error-banner">{error}</div>}

      <div>
        <label htmlFor="modsProfile">Profil</label>
        <select id="modsProfile" value={activeProfileId} onChange={(e) => setActiveProfileId(e.target.value)}>
          {javaProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleImportModpack}>
          {t('mods.importModpack')}
        </button>
      </div>

      <div>
        <label htmlFor="modsPlatform">Plattform</label>
        <select
          id="modsPlatform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as 'modrinth' | 'curseforge')}
        >
          <option value="modrinth">Modrinth</option>
          <option value="curseforge" disabled={!curseforgeEnabled}>
            CurseForge {curseforgeEnabled ? '' : `(${t('mods.curseforgeDisabled')})`}
          </option>
        </select>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('mods.search')} />
        <button type="button" onClick={handleSearch}>
          {t('mods.search')}
        </button>
      </div>

      <ul>
        {results.map((mod) => (
          <li key={`${mod.platform}-${mod.projectId}`}>
            <strong>{mod.name}</strong> von {mod.author} – {mod.downloads} Downloads
            <p>{mod.summary}</p>
            <button type="button" onClick={() => handleLoadVersions(mod)}>
              Versionen laden
            </button>
            <ul>
              {(versionsByProject[mod.projectId] ?? []).map((version) => (
                <li key={version.versionId}>
                  {version.versionNumber} ({version.fileName})
                  <button type="button" onClick={() => handleInstall(version)}>
                    {t('mods.install')}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <h2>{t('mods.installed')}</h2>
      <button type="button" onClick={handleAddManual}>
        {t('mods.addManual')}
      </button>
      <button type="button" onClick={handleCheckUpdates}>
        {t('mods.checkUpdates')}
      </button>
      {updatable.length > 0 && (
        <button type="button" onClick={handleUpdateAll}>
          {t('mods.updateAll')} ({updatable.length})
        </button>
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Version</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {installed.map((mod) => (
            <tr key={mod.id}>
              <td>{mod.name}</td>
              <td>{mod.versionNumber ?? '-'}</td>
              <td>{mod.enabled ? 'aktiv' : 'deaktiviert'}</td>
              <td>
                <button type="button" onClick={() => handleToggle(mod)}>
                  {mod.enabled ? t('mods.disable') : t('mods.enable')}
                </button>
                <button type="button" onClick={() => handleRemove(mod)}>
                  {t('mods.remove')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
