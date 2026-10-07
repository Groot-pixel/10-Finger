import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
  }`;

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur html-light:bg-white/90">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 font-bold text-emerald-400 shrink-0">
          <span className="text-xl">🧱</span> CraftGuide
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>Bibliothek</NavLink>
          {user && <NavLink to="/favorites" className={linkClass}>Favoriten</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="btn-ghost !px-2" title="Theme wechseln" aria-label="Theme wechseln">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-800"
              >
                <span className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                  {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name?.[0]?.toUpperCase() || '?'}
                </span>
                <span className="hidden sm:inline text-sm">{user.name}</span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 card p-1 shadow-xl"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-800">
                    Profil
                  </Link>
                  <Link to="/favorites" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-800 md:hidden">
                    Favoriten
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-800 md:hidden">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate('/');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-slate-800"
                  >
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary">Anmelden</Link>
          )}
        </div>
      </div>
    </header>
  );
}
