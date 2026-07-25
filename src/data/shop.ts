export type CosmeticSlot = 'head' | 'eyes' | 'neck'

export interface ShopItem {
  id: string
  title: string
  description: string
  icon: string
  price: number
  kind: 'consumable' | 'cosmetic'
  /** cosmetics in the same slot replace each other when equipped */
  slot?: CosmeticSlot
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'mascot-bandana',
    title: 'Halstuch für Flowy',
    description: 'Ein farbenfrohes Halstuch für dein Maskottchen.',
    icon: '🧣',
    price: 90,
    kind: 'cosmetic',
    slot: 'neck',
  },
  {
    id: 'streak-freeze',
    title: 'Serien-Frost',
    description: 'Schützt deine Serie an einem Tag, an dem du nicht übst.',
    icon: '🧊',
    price: 100,
    kind: 'consumable',
  },
  {
    id: 'xp-boost',
    title: 'EP-Boost (15 Min)',
    description: 'Doppelte EP für deine nächsten 3 Lektionen.',
    icon: '🚀',
    price: 80,
    kind: 'consumable',
  },
  {
    id: 'mascot-cap',
    title: 'Käppi für Flowy',
    description: 'Ein cooles Käppchen für dein Maskottchen.',
    icon: '🧢',
    price: 150,
    kind: 'cosmetic',
    slot: 'head',
  },
  {
    id: 'mascot-sunglasses',
    title: 'Sonnenbrille für Flowy',
    description: 'Style trifft Tippgeschwindigkeit.',
    icon: '🕶️',
    price: 150,
    kind: 'cosmetic',
    slot: 'eyes',
  },
  {
    id: 'mascot-crown',
    title: 'Krone für Flowy',
    description: 'Für echte Tipp-Champions.',
    icon: '👑',
    price: 300,
    kind: 'cosmetic',
    slot: 'head',
  },
]
