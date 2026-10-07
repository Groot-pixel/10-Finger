import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { DeviceCodePrompt } from '@shared/ipc-api'
import { useTranslation } from '../i18n/useTranslation'
import { useAppStore } from '../store/useAppStore'

export function AccountManager(): JSX.Element {
  const { t } = useTranslation()
  const { accounts, refreshAccounts } = useAppStore()
  const [prompt, setPrompt] = useState<DeviceCodePrompt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    const unsubscribe = window.daybreak.accounts.onLoginResult((result) => {
      setLoggingIn(false)
      setPrompt(null)
      if (result.ok) {
        void refreshAccounts()
      } else {
        setError(result.error.message)
      }
    })
    return unsubscribe
  }, [refreshAccounts])

  async function handleLogin(): Promise<void> {
    setError(null)
    setLoggingIn(true)
    const result = await window.daybreak.accounts.startMicrosoftLogin()
    if (result.ok) {
      setPrompt(result.data)
    } else {
      setLoggingIn(false)
      setError(result.error.message)
    }
  }

  async function handleCancel(): Promise<void> {
    await window.daybreak.accounts.cancelMicrosoftLogin()
    setLoggingIn(false)
    setPrompt(null)
  }

  async function handleSetActive(id: string): Promise<void> {
    const result = await window.daybreak.accounts.setActive(id)
    if (result.ok) await refreshAccounts()
  }

  async function handleRemove(id: string): Promise<void> {
    const result = await window.daybreak.accounts.remove(id)
    if (result.ok) await refreshAccounts()
  }

  return (
    <div>
      <h2>{t('accounts.title')}</h2>
      {error && <div className="error-banner">{error}</div>}
      <ul>
        {accounts.map((account) => (
          <li key={account.id}>
            {account.isActive ? '✓ ' : ''}
            {account.minecraftUsername}
            <button type="button" onClick={() => handleSetActive(account.id)} disabled={account.isActive}>
              {t('accounts.activate')}
            </button>
            <button type="button" onClick={() => handleRemove(account.id)}>
              {t('accounts.remove')}
            </button>
          </li>
        ))}
      </ul>

      {prompt ? (
        <div>
          <p>{t('accounts.deviceCodeInstructions', { url: prompt.verificationUri })}</p>
          <strong style={{ fontSize: '1.5rem' }}>{prompt.userCode}</strong>
          <div>
            <button type="button" onClick={handleCancel}>
              {t('accounts.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={handleLogin} disabled={loggingIn}>
          {t('accounts.addAccount')}
        </button>
      )}
    </div>
  )
}
