import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { LaunchProgressEvent, NewsItem, PartnerServer } from '@shared/types'
import { useTranslation } from '../i18n/useTranslation'
import { useAppStore } from '../store/useAppStore'
import { ProfileManager } from '../components/ProfileManager'
import { AccountManager } from '../components/AccountManager'

function formatPlaytime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export function HomePage(): JSX.Element {
  const { t } = useTranslation()
  const { profiles, accounts, activeProfileId, setActiveProfileId, refreshProfiles } = useAppStore()
  const [showProfileManager, setShowProfileManager] = useState(false)
  const [showAccountManager, setShowAccountManager] = useState(false)
  const [progress, setProgress] = useState<LaunchProgressEvent | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [partnerServers, setPartnerServers] = useState<PartnerServer[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const activeAccount = accounts.find((a) => a.isActive) ?? null
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  useEffect(() => {
    void window.daybreak.servers.listPartners().then(setPartnerServers)
    void window.daybreak.servers.listNews().then(setNews)
    const unsubscribe = window.daybreak.launch.onProgress((event) => {
      if (event.profileId !== activeProfileId) return
      setProgress(event)
      if (event.phase === 'exited' || event.phase === 'error') setIsRunning(false)
      if (event.phase === 'running') setIsRunning(true)
    })
    return unsubscribe
  }, [activeProfileId])

  useEffect(() => {
    void window.daybreak.launch.isRunning(activeProfileId).then(setIsRunning)
  }, [activeProfileId])

  async function handlePlay(): Promise<void> {
    setLaunchError(null)
    const result = await window.daybreak.launch.start(activeProfileId)
    if (!result.ok) {
      setLaunchError(result.error.message)
    }
  }

  async function handleStop(): Promise<void> {
    await window.daybreak.launch.stop(activeProfileId)
  }

  async function handleCopyAddress(address: string): Promise<void> {
    await window.daybreak.servers.copyAddress(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  return (
    <section>
      <div>
        <select value={activeProfileId} onChange={(e) => setActiveProfileId(e.target.value)}>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setShowProfileManager((v) => !v)}>
          {t('home.manageProfiles')}
        </button>
      </div>

      <div>
        {activeAccount ? (
          <span>{activeAccount.minecraftUsername}</span>
        ) : (
          <span>{t('home.noAccount')}</span>
        )}
        <button type="button" onClick={() => setShowAccountManager((v) => !v)}>
          {activeAccount ? t('accounts.title') : t('home.login')}
        </button>
      </div>

      {activeProfile && (
        <p>
          {t('home.playtime')}: {formatPlaytime(activeProfile.totalPlaytimeSeconds)}
        </p>
      )}

      {launchError && <div className="error-banner">{launchError}</div>}

      {progress && progress.profileId === activeProfileId && <p>{progress.message}</p>}

      <div>
        {isRunning ? (
          <button type="button" onClick={handleStop}>
            {t('home.stop')}
          </button>
        ) : (
          <button type="button" onClick={handlePlay} style={{ fontSize: '1.5rem', padding: '0.5rem 2rem' }}>
            {t('home.playNow')}
          </button>
        )}
      </div>

      {showProfileManager && (
        <ProfileManager
          onClose={() => {
            setShowProfileManager(false)
            void refreshProfiles()
          }}
        />
      )}
      {showAccountManager && <AccountManager />}

      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <h2>{t('home.partnerServers')}</h2>
          <ul>
            {partnerServers.map((server) => (
              <li key={server.id}>
                <button type="button" onClick={() => handleCopyAddress(server.address)}>
                  {server.name} ({server.address})
                </button>
                {copiedAddress === server.address && <span> {t('home.addressCopied')}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>{t('home.news')}</h2>
          <ul>
            {news.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
