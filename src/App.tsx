import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'
import TopBar from './components/layout/TopBar'
import ToastHost from './components/ToastHost'
import PathPage from './pages/PathPage'
import LessonPage from './pages/LessonPage'
import PracticePage from './pages/PracticePage'
import LeaguePage from './pages/LeaguePage'
import AchievementsPage from './pages/AchievementsPage'
import ShopPage from './pages/ShopPage'
import ProfilePage from './pages/ProfilePage'
import PlacementTestPage from './pages/PlacementTestPage'
import QuestsPage from './pages/QuestsPage'

function App() {
  const view = useStore((s) => s.view)
  const ensureDaily = useStore((s) => s.ensureDaily)
  const ensureLeagueWeek = useStore((s) => s.ensureLeagueWeek)

  useEffect(() => {
    // the warm plush design is made for the dark theme only
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  useEffect(() => {
    ensureDaily()
    ensureLeagueWeek()
  }, [ensureDaily, ensureLeagueWeek])

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        {view !== 'lesson' && <TopBar />}
        <main className="flex-1">
          {view === 'path' && <PathPage />}
          {view === 'lesson' && <LessonPage />}
          {view === 'practice' && <PracticePage />}
          {view === 'league' && <LeaguePage />}
          {view === 'achievements' && <AchievementsPage />}
          {view === 'shop' && <ShopPage />}
          {view === 'profile' && <ProfilePage />}
          {view === 'placement' && <PlacementTestPage />}
          {view === 'quests' && <QuestsPage />}
        </main>
        {view !== 'lesson' && <BottomNav />}
      </div>
      <ToastHost />
    </div>
  )
}

export default App
