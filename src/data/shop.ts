export interface ShopItem {
  id: string
  title: string
  description: string
  icon: string
  price: number
  kind: 'consumable' | 'cosmetic'
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'mascot-bandana',
    title: 'Halstuch für Flowy',
    description: 'Ein farbenfrohes Halstuch für dein Maskottchen.',
    icon: '🧣',
    price: 90,
    kind: 'cosmetic',
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
  },
  {
    id: 'mascot-sunglasses',
    title: 'Sonnenbrille für Flowy',
    description: 'Style trifft Tippgeschwindigkeit.',
    icon: '🕶️',
    price: 150,
    kind: 'cosmetic',
  },
  {
    id: 'mascot-crown',
    title: 'Krone für Flowy',
    description: 'Für echte Tipp-Champions.',
    icon: '👑',
    price: 300,
    kind: 'cosmetic',
  },
  {
    id: 'theme-dark',
    title: 'Dunkles Theme',
    description: 'Schalte den Dark Mode dauerhaft frei.',
    icon: '🌙',
    price: 120,
    kind: 'cosmetic',
  },
]
