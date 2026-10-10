export type CosmeticSlot = 'head' | 'eyes' | 'neck' | 'ears' | 'chest'

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
    title: 'Türkises Halstuch für Flowy',
    description: 'Weicher Stoff mit goldenen Punkten.',
    icon: 'scarf',
    price: 90,
    kind: 'cosmetic',
    slot: 'neck',
  },
  {
    id: 'streak-freeze',
    title: 'Serien-Frost',
    description: 'Schützt deine Serie an einem Tag, an dem du nicht übst.',
    icon: 'ice',
    price: 100,
    kind: 'consumable',
  },
  {
    id: 'xp-boost',
    title: 'EP-Boost (15 Min)',
    description: 'Doppelte EP für deine nächsten 3 Lektionen.',
    icon: 'rocket',
    price: 80,
    kind: 'consumable',
  },
  {
    id: 'mascot-cap',
    title: 'Cord-Käppi für Flowy',
    description: 'Ein weiches Käppi im ZehnFinger-Türkis.',
    icon: 'cap',
    price: 150,
    kind: 'cosmetic',
    slot: 'head',
  },
  {
    id: 'mascot-sunglasses',
    title: 'Retro-Brille für Flowy',
    description: 'Runde Gläser mit warmen Goldbügeln.',
    icon: 'glasses',
    price: 150,
    kind: 'cosmetic',
    slot: 'eyes',
  },
  {
    id: 'mascot-crown',
    title: 'Plüsch-Krone für Flowy',
    description: 'Gold, weich und mit türkisem Edelstein.',
    icon: 'crown',
    price: 300,
    kind: 'cosmetic',
    slot: 'head',
  },
  {
    id: 'mascot-explorer',
    title: 'Entdeckerhut für Flowy',
    description: 'Für mutige Expeditionen über die Tastatur.',
    icon: 'map',
    price: 220,
    kind: 'cosmetic',
    slot: 'head',
  },
  {
    id: 'mascot-headphones',
    title: 'Kopfhörer für Flowy',
    description: 'Türkis, bequem und bereit für den Tipp-Beat.',
    icon: 'sound',
    price: 240,
    kind: 'cosmetic',
    slot: 'ears',
  },
  {
    id: 'mascot-bow',
    title: 'Fliege für Flowy',
    description: 'Festlich, weich und mit goldenem Knopf.',
    icon: 'star',
    price: 130,
    kind: 'cosmetic',
    slot: 'neck',
  },
  {
    id: 'mascot-leafbadge',
    title: 'Blatt-Abzeichen für Flowy',
    description: 'Ein kleines Zeichen für ruhiges, stetiges Lernen.',
    icon: 'medal',
    price: 110,
    kind: 'cosmetic',
    slot: 'chest',
  },
]
