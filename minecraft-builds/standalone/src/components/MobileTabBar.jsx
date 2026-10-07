const tabs = [
  { name: 'library', icon: '📚', label: 'Bibliothek' },
  { name: 'favorites', icon: '⭐', label: 'Favoriten' },
  { name: 'categories', icon: '🏷️', label: 'Tags' },
  { name: 'settings', icon: '⚙️', label: 'Daten' },
];

export default function MobileTabBar({ view, navigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur flex">
      {tabs.map((t) => (
        <button
          key={t.name}
          onClick={() => navigate({ name: t.name })}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs ${view.name === t.name ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <span className="text-lg">{t.icon}</span> {t.label}
        </button>
      ))}
    </nav>
  );
}
