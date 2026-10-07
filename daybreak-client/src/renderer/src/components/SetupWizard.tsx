import { useState } from 'react'
import type { JSX } from 'react'
import type { Language } from '@shared/types'
import type { JavaScanResult } from '@shared/ipc-api'
import { useTranslation } from '../i18n/useTranslation'
import { AccountManager } from './AccountManager'

export function SetupWizard({ onFinish }: { onFinish: (language: Language) => void }): JSX.Element {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [language, setLanguage] = useState<Language>('de')
  const [javaResults, setJavaResults] = useState<JavaScanResult[]>([])
  const [recommendedRam, setRecommendedRam] = useState<number | null>(null)

  async function handleNextFromLanguage(): Promise<void> {
    setStep(1)
  }

  async function handleScanJava(): Promise<void> {
    const result = await window.daybreak.settings.scanJava()
    if (result.ok) setJavaResults(result.data)
    setStep(2)
  }

  async function handleLoadRam(): Promise<void> {
    const ram = await window.daybreak.settings.recommendedRamMb()
    setRecommendedRam(ram)
    setStep(3)
  }

  async function handleFinish(): Promise<void> {
    await window.daybreak.settings.update({ language, defaultRamMb: recommendedRam ?? undefined })
    await window.daybreak.app.completeSetupWizard({
      completed: true,
      language,
      javaPath: javaResults[0]?.path ?? null,
      recommendedRamMb: recommendedRam
    })
    onFinish(language)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{t('setup.title')}</h1>
      {step === 0 && (
        <div>
          <h2>{t('setup.step1')}</h2>
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
          <button type="button" onClick={handleNextFromLanguage}>
            {t('setup.next')}
          </button>
        </div>
      )}
      {step === 1 && (
        <div>
          <h2>{t('setup.step2')}</h2>
          <button type="button" onClick={handleScanJava}>
            {t('setup.next')}
          </button>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2>{t('setup.step3')}</h2>
          <p>Gefundene Java-Installationen: {javaResults.length}</p>
          <button type="button" onClick={handleLoadRam}>
            {t('setup.next')}
          </button>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2>{t('setup.step4')}</h2>
          <p>Empfohlener Arbeitsspeicher: {recommendedRam} MB</p>
          <AccountManager />
          <button type="button" onClick={handleFinish}>
            {t('setup.finish')}
          </button>
        </div>
      )}
    </div>
  )
}
