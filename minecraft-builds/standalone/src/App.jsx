import { useState } from 'react';
import Navbar from './components/Navbar';
import MobileTabBar from './components/MobileTabBar';
import ToastHost from './components/ui/ToastHost';
import Library from './pages/Library';
import BuildDetail from './pages/BuildDetail';
import BuildEditor from './pages/BuildEditor';
import Favorites from './pages/Favorites';
import CategoriesManage from './pages/CategoriesManage';
import Settings from './pages/Settings';

export default function App() {
  const [view, setView] = useState({ name: 'library' });

  function navigate(next) {
    setView(next);
    window.scrollTo(0, 0);
  }

  return (
    <div className="min-h-screen flex flex-col pb-14 md:pb-0">
      <Navbar view={view} navigate={navigate} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {view.name === 'library' && <Library navigate={navigate} />}
        {view.name === 'detail' && <BuildDetail buildId={view.id} navigate={navigate} />}
        {view.name === 'editor' && <BuildEditor buildId={view.id} navigate={navigate} />}
        {view.name === 'favorites' && <Favorites navigate={navigate} />}
        {view.name === 'categories' && <CategoriesManage />}
        {view.name === 'settings' && <Settings />}
      </main>
      <MobileTabBar view={view} navigate={navigate} />
      <ToastHost />
    </div>
  );
}
