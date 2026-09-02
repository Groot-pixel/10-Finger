import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

export default function Navbar({ view, navigate }) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const linkClass = (name) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view.name === name ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <button onClick={() => navigate({ name: 'library' })} className="flex items-center gap-2 font-bold text-emerald-400 shrink-0">
          <span className="text-xl">🧱</span> CraftGuide Solo
        </button>
        <nav className="hidden md:flex items-center gap-1">
          <button className={linkClass('library')} onClick={() => navigate({ name: 'library' })}>Bibliothek</button>
          <button className={linkClass('favorites')} onClick={() => navigate({ name: 'favorites' })}>Favoriten</button>
          <button className={linkClass('categories')} onClick={() => navigate({ name: 'categories' })}>Kategorien & Tags</button>
          <button className={linkClass('settings')} onClick={() => navigate({ name: 'settings' })}>Daten & Export</button>
        </nav>
        <button onClick={toggleTheme} className="btn-ghost !px-2" title="Theme wechseln" aria-label="Theme wechseln">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
