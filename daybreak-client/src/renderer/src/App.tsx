import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import type { Language, SetupWizardState } from '@shared/types'
import { LanguageContext } from './i18n/useTranslation'
import { useAppStore } from './store/useAppStore'
import { Nav } from './components/Nav'
import { SetupWizard } from './components/SetupWizard'
import { HomePage } from './pages/HomePage'
import { ModsPage } from './pages/ModsPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { SettingsPage } from './pages/SettingsPage'
import { ConsolePage } from './pages/ConsolePage'

export default function App(): JSX.Element {
  const { settings, error, loading, refreshAll } = useAppStore()
  const [wizardState, setWizardState] = useState<SetupWizardState | null>(null)
  const [language, setLanguage] = useState<Language>('de')

  useEffect(() => {
    void window.daybreak.app.getSetupWizardState().then(setWizardState)
    void refreshAll()
  }, [refreshAll])

  useEffect(() => {
    if (settings) setLanguage(settings.language)
  }, [settings])

  if (!wizardState || loading) {
    return <p style={{ padding: '2rem' }}>Lädt ...</p>
  }

  if (!wizardState.completed) {
    return (
      <LanguageContext.Provider value={language}>
        <SetupWizard
          onFinish={(finishedLanguage) => {
            setLanguage(finishedLanguage)
            setWizardState({ ...wizardState, completed: true })
            void refreshAll()
          }}
        />
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={language}>
      <HashRouter>
        <Nav />
        <main>
          {error && <div className="error-banner">{error}</div>}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/mods" element={<ModsPage />} />
            <Route path="/community" element={<ComingSoonPage title="Community" />} />
            <Route path="/cosmetics" element={<ComingSoonPage title="Cosmetics" />} />
            <Route path="/hosting" element={<ComingSoonPage title="Hosting" />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/console" element={<ConsolePage />} />
          </Routes>
        </main>
      </HashRouter>
    </LanguageContext.Provider>
  )
}
