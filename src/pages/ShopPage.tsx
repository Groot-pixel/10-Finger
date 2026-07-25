import { useStore } from '../store/useStore'
import { SHOP_ITEMS } from '../data/shop'
import Mascot from '../components/Mascot'

export default function ShopPage() {
  const gems = useStore((s) => s.gems)
  const buyItem = useStore((s) => s.buyItem)
  const pushToast = useStore((s) => s.pushToast)
  const ownedItems = useStore((s) => s.ownedItems)
  const equippedCosmetics = useStore((s) => s.equippedCosmetics)
  const equipCosmetic = useStore((s) => s.equipCosmetic)
  const darkModeUnlocked = useStore((s) => s.darkModeUnlocked)
  const streakFreezes = useStore((s) => s.streakFreezes)
  const xpBoostLessonsLeft = useStore((s) => s.xpBoostLessonsLeft)

  const handleBuy = (id: string, price: number, title: string, icon: string) => {
    const ok = buyItem(id, price)
    if (ok) pushToast({ icon, title: 'Gekauft!', subtitle: title, tone: 'success' })
    else pushToast({ icon: '💎', title: 'Nicht genug Gems', tone: 'warning' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}>
        <Mascot mood="love" size={56} accessories={equippedCosmetics} />
        <div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Dein Guthaben</div>
          <div className="text-2xl font-extrabold text-sky-500">💎 {gems}</div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
          <span>🧊 {streakFreezes} Serien-Frost</span>
          <span>🚀 {xpBoostLessonsLeft} Boost-Lektionen</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SHOP_ITEMS.map((item) => {
          const owned = item.kind === 'cosmetic' && item.id !== 'theme-dark' && ownedItems.includes(item.id)
          const isDarkDone = item.id === 'theme-dark' && darkModeUnlocked
          const equipped = equippedCosmetics.includes(item.id)
          return (
            <div key={item.id} className="flex flex-col gap-2 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', boxShadow: 'var(--card-shadow)' }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-extrabold">{item.title}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
              {owned || isDarkDone ? (
                item.kind === 'cosmetic' && item.id !== 'theme-dark' ? (
                  <button
                    onClick={() => equipCosmetic(item.id)}
                    className="btn-press mt-1 rounded-xl px-4 py-2 text-sm font-bold"
                    style={{ background: equipped ? 'var(--primary)' : 'var(--kb-key-bg)', color: equipped ? 'white' : 'var(--text)' }}
                  >
                    {equipped ? 'Angelegt ✓' : 'Anlegen'}
                  </button>
                ) : (
                  <span className="mt-1 text-sm font-bold text-emerald-500">Freigeschaltet ✓</span>
                )
              ) : (
                <button
                  onClick={() => handleBuy(item.id, item.price, item.title, item.icon)}
                  disabled={gems < item.price}
                  className="btn-press mt-1 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: 'var(--primary)' }}
                >
                  💎 {item.price}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
