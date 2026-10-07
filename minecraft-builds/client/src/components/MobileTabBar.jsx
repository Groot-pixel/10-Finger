import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const tabClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs ${
    isActive ? 'text-emerald-400' : 'text-slate-400'
  }`;

export default function MobileTabBar() {
  const user = useAuthStore((s) => s.user);
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur flex">
      <NavLink to="/" end className={tabClass}>
        <span className="text-lg">📚</span> Bibliothek
      </NavLink>
      <NavLink to="/favorites" className={tabClass}>
        <span className="text-lg">⭐</span> Favoriten
      </NavLink>
      <NavLink to="/profile" className={tabClass}>
        <span className="text-lg">👤</span> Profil
      </NavLink>
      {user?.role === 'admin' && (
        <NavLink to="/admin" className={tabClass}>
          <span className="text-lg">🛠️</span> Admin
        </NavLink>
      )}
    </nav>
  );
}
