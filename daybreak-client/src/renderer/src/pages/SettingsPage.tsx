import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { JavaScanResult } from '@shared/ipc-api'
import { useTranslation } from '../i18n/useTranslation'
import { useAppStore } from '../store/useAppStore'

export function SettingsPage(): JSX.Element {
  const { t } = useTranslation()
  const { settings, refreshSettings } = useAppStore()
  const [language, setLanguage] = useState(settings?.language ?? 'de')
  const [ramMb, setRamMb] = useState(settings?.defaultRamMb ?? 4096)
  const [javaPath, setJavaPath] = useState(settings?.javaPath ?? '')
  const [gameDir, setGameDir] = useState(settings?.defaultGameDir ?? '')
  const [curseForgeApiKey, setCurseForgeApiKey] = useState('')
  const [microsoftClientId, setMicrosoftClientId] = useState(settings?.microsoftClientIdOverride ?? '')
  const [discordRpcEnabled, setDiscordRpcEnabled] = useState(settings?.discordRpcEnabled ?? true)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(settings?.autoUpdateEnabled ?? true)
  const [javaResults, setJavaResults] = useState<JavaScanResult[]>([])
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return
    setLanguage(settings.language)
    setRamMb(settings.defaultRamMb)
    setJavaPath(settings.javaPath ?? '')
    setGameDir(settings.defaultGameDir)
    setMicrosoftClientId(settings.microsoftClientIdOverride ?? '')
    setDiscordRpcEnabled(settings.discordRpcEnabled)
    setAutoUpdateEnabled(settings.autoUpdateEnabled)
  }, [settings])

  async function handleScanJava(): Promise<void> {
    const result = await window.daybreak.settings.scanJava()
    if (result.ok) {
      setJavaResults(result.data)
    } else {
      setMessage(result.error.message)
    }
  }

  async function handlePickJavaPath(): Promise<void> {
    const result = await window.daybreak.settings.pickJavaPath()
    if (result.ok && result.data) setJavaPath(result.data)
  }

  async function handlePickGameDir(): Promise<void> {
    const result = await window.daybreak.settings.pickGameDir()
    if (result.ok && result.data) setGameDir(result.data)
  }

  async function handleSave(): Promise<void> {
    const result = await window.daybreak.settings.update({
      language,
      defaultRamMb: ramMb,
      javaPath: javaPath || null,
      defaultGameDir: gameDir,
      microsoftClientIdOverride: microsoftClientId || null,
      curseForgeApiKey: curseForgeApiKey || undefined,
      discordRpcEnabled,
      autoUpdateEnabled
    })
    if (result.ok) {
      setMessage('Gespeichert.')
      setCurseForgeApiKey('')
      await refreshSettings()
    } else {
      setMessage(result.error.message)
    }
  }

  return (
    <section>
      <h1>{t('settings.title')}</h1>
      {message && <div className="error-banner">{message}</div>}

      <div>
        <label htmlFor="language">{t('settings.language')}</label>
        <select id="language" value={language} onChange={(e) => setLanguage(e.target.value as 'de' | 'en')}>
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label htmlFor="ram">{t('settings.ram')}</label>
        <input
          id="ram"
          type="number"
          min={512}
          step={512}
          value={ramMb}
          onChange={(e) => setRamMb(Number(e.target.value))}
        />
      </div>

      <div>
        <label htmlFor="javaPath">{t('settings.javaPath')}</label>
        <input id="javaPath" type="text" value={javaPath} onChange={(e) => setJavaPath(e.target.value)} />
        <button type="button" onClick={handlePickJavaPath}>
          ...
        </button>
        <button type="button" onClick={handleScanJava}>
          {t('settings.scanJava')}
        </button>
        <ul>
          {javaResults.map((j) => (
            <li key={j.path}>
              <button type="button" onClick={() => setJavaPath(j.path)}>
                Java {j.majorVersion} – {j.path}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label htmlFor="gameDir">{t('settings.gameDir')}</label>
        <input id="gameDir" type="text" value={gameDir} onChange={(e) => setGameDir(e.target.value)} />
        <button type="button" onClick={handlePickGameDir}>
          ...
        </button>
      </div>

      <div>
        <label htmlFor="msClientId">{t('settings.microsoftClientId')}</label>
        <input
          id="msClientId"
          type="text"
          placeholder="DAYBREAK_MICROSOFT_CLIENT_ID"
          value={microsoftClientId}
          onChange={(e) => setMicrosoftClientId(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="cfKey">
          {t('settings.curseforgeKey')} {settings?.hasCurseForgeApiKey ? '(gesetzt)' : '(nicht gesetzt)'}
        </label>
        <input
          id="cfKey"
          type="password"
          placeholder="••••••••"
          value={curseForgeApiKey}
          onChange={(e) => setCurseForgeApiKey(e.target.value)}
        />
      </div>

      <div>
        <label>
          <input type="checkbox" checked={discordRpcEnabled} onChange={(e) => setDiscordRpcEnabled(e.target.checked)} />
          {t('settings.discordRpc')}
        </label>
      </div>

      <div>
        <label>
          <input type="checkbox" checked={autoUpdateEnabled} onChange={(e) => setAutoUpdateEnabled(e.target.checked)} />
          {t('settings.autoUpdate')}
        </label>
      </div>

      <button type="button" onClick={handleSave}>
        {t('settings.save')}
      </button>
    </section>
  )
}
