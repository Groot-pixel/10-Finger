import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`;

export default function AdminLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <aside className="card p-3 h-fit space-y-1">
        <p className="text-xs uppercase text-slate-500 px-3 pb-1">Admin-Bereich</p>
        <NavLink to="/admin" end className={linkClass}>📊 Dashboard</NavLink>
        <NavLink to="/admin/builds" className={linkClass}>🧱 Builds</NavLink>
        <NavLink to="/admin/builds/new" className={linkClass}>➕ Neuer Build</NavLink>
        <NavLink to="/admin/categories" className={linkClass}>🏷️ Kategorien & Tags</NavLink>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
