import { useStore } from '../store/useStore'
import { SHOP_ITEMS } from '../data/shop'
import Mascot from '../components/Mascot'
import Icon from '../components/Icon'
import { BannerPattern } from '../components/Art'

export default function ShopPage() {
  const gems = useStore((s) => s.gems)
  const buyItem = useStore((s) => s.buyItem)
  const pushToast = useStore((s) => s.pushToast)
  const ownedItems = useStore((s) => s.ownedItems)
  const equippedCosmetics = useStore((s) => s.equippedCosmetics)
  const equipCosmetic = useStore((s) => s.equipCosmetic)
  const streakFreezes = useStore((s) => s.streakFreezes)
  const xpBoostLessonsLeft = useStore((s) => s.xpBoostLessonsLeft)

  const handleBuy = (id: string, price: number, title: string, icon: string) => {
    const ok = buyItem(id, price)
    if (ok) pushToast({ icon, title: 'Gekauft!', subtitle: title, tone: 'success' })
    else pushToast({ icon: 'gem', title: 'Nicht genug Gems', tone: 'warning' })
  }

  const powerUps = SHOP_ITEMS.filter((i) => i.kind === 'consumable')
  const outfits = SHOP_ITEMS.filter((i) => i.kind === 'cosmetic')
  const stock: Record<string, number> = { 'streak-freeze': streakFreezes, 'xp-boost': xpBoostLessonsLeft }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="relative mb-7 overflow-hidden rounded-3xl px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #ff86d0, #e066b0)', boxShadow: '0 5px 0 #c04f96' }}>
        <BannerPattern />
        <div className="relative flex items-center gap-4">
          <Mascot mood="love" size={88} accessories={equippedCosmetics} />
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-90">Shop</div>
            <div className="text-sm font-semibold opacity-90">Dein Guthaben</div>
            <div className="flex items-center gap-2 text-3xl font-black">
              <Icon name="gem" size={34} /> {gems}
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-extrabold">Power-ups</h2>
      <div className="tile mb-8 flex flex-col divide-y-2" style={{ borderColor: 'var(--border)' }}>
        {powerUps.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Icon name={item.icon} size={56} />
              {(stock[item.id] ?? 0) > 0 && (
                <span className="absolute -bottom-1 -right-1 rounded-full px-1.5 text-[10px] font-black text-white" style={{ background: '#1cb0f6' }}>
                  ×{stock[item.id]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-extrabold">{item.title}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.description}</div>
            </div>
            <PriceButton price={item.price} disabled={gems < item.price} onClick={() => handleBuy(item.id, item.price, item.title, item.icon)} />
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-extrabold">Outfits für Flowy</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {outfits.map((item) => {
          const owned = ownedItems.includes(item.id)
          const equipped = equippedCosmetics.includes(item.id)
          return (
            <div
              key={item.id}
              className="tile flex flex-col items-center gap-2 p-3 text-center"
              style={{ borderColor: equipped ? '#58cc02' : undefined }}
            >
              <div className="flex h-24 w-full items-center justify-center rounded-xl" style={{ background: 'var(--kb-key-bg)' }}>
                <Mascot mood="happy" size={84} accessories={[item.id]} />
              </div>
              <div className="text-sm font-extrabold leading-tight">{item.title.replace(' für Flowy', '')}</div>
              {owned ? (
                <button
                  onClick={() => equipCosmetic(item.id)}
                  className="btn-3d w-full border-2 px-2 py-1.5 text-xs"
                  style={{
                    background: equipped ? '#58cc02' : 'var(--bg-elevated)',
                    borderColor: equipped ? '#58cc02' : 'var(--border)',
                    color: equipped ? '#fff' : '#1cb0f6',
                    ['--btn-edge' as string]: equipped ? '#46a302' : 'var(--border)',
                  }}
                >
                  {equipped ? 'Angelegt' : 'Anlegen'}
                </button>
              ) : (
                <PriceButton price={item.price} disabled={gems < item.price} onClick={() => handleBuy(item.id, item.price, item.title, item.icon)} full />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PriceButton({ price, disabled, onClick, full }: { price: number; disabled: boolean; onClick: () => void; full?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-3d flex items-center justify-center gap-1 border-2 px-3 py-1.5 text-sm ${full ? 'w-full' : ''}`}
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: '#1cb0f6', ['--btn-edge' as string]: 'var(--border)' }}
    >
      <Icon name="gem" size={18} />
      {price}
    </button>
  )
}
