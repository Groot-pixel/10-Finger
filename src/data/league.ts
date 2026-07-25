import { mulberry32, seedFromString } from './content'

export interface LeagueDef {
  id: string
  name: string
  color: string
  icon: string
  /** average weekly XP pace of bots in this league, used to scale simulated activity */
  botPaceMin: number
  botPaceMax: number
}

export const LEAGUES: LeagueDef[] = [
  { id: 'bronze', name: 'Bronze-Liga', color: '#b45309', icon: '🥉', botPaceMin: 20, botPaceMax: 120 },
  { id: 'silber', name: 'Silber-Liga', color: '#94a3b8', icon: '🥈', botPaceMin: 40, botPaceMax: 160 },
  { id: 'gold', name: 'Gold-Liga', color: '#eab308', icon: '🥇', botPaceMin: 60, botPaceMax: 200 },
  { id: 'saphir', name: 'Saphir-Liga', color: '#0ea5e9', icon: '💠', botPaceMin: 80, botPaceMax: 240 },
  { id: 'rubin', name: 'Rubin-Liga', color: '#e11d48', icon: '💎', botPaceMin: 100, botPaceMax: 280 },
  { id: 'smaragd', name: 'Smaragd-Liga', color: '#059669', icon: '💚', botPaceMin: 120, botPaceMax: 320 },
  { id: 'amethyst', name: 'Amethyst-Liga', color: '#9333ea', icon: '🔮', botPaceMin: 140, botPaceMax: 360 },
  { id: 'perle', name: 'Perlen-Liga', color: '#f0abfc', icon: '🫧', botPaceMin: 160, botPaceMax: 400 },
  { id: 'obsidian', name: 'Obsidian-Liga', color: '#334155', icon: '⚫', botPaceMin: 180, botPaceMax: 440 },
  { id: 'diamant', name: 'Diamant-Liga', color: '#22d3ee', icon: '💎', botPaceMin: 200, botPaceMax: 500 },
]

export const PROMOTE_COUNT = 7
export const DEMOTE_COUNT = 5
export const LEAGUE_SIZE = 20 // includes player

const BOT_NAMES = [
  'TastenTiger', 'FlinkeFeder', 'SchnellSchreiber', 'WortWirbel', 'TippTornado',
  'ZackZack', 'BuchstabenBlitz', 'FingerFuchs', 'RasendeRosa', 'CleverClara',
  'MaxMuster', 'LisaLoop', 'NoahNimm', 'EmmaEnter', 'LeonLeise',
  'MiaMulti', 'FinnFix', 'SaraSpeed', 'JonasJet', 'AnnaAlpha',
  'TomTakt', 'LenaLicht', 'PaulPfeil', 'ZoeZiel', 'BenBlitz',
  'KimKomet', 'RayRaketen', 'NilsNova', 'FreyaFlash', 'ElaEcho',
]

export function getWeekStartISO(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7 // Monday = 1 ... Sunday = 7
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1))
  return date.toISOString().slice(0, 10)
}

export function weekFractionElapsed(weekStartISO: string, now: Date = new Date()): number {
  const start = new Date(weekStartISO + 'T00:00:00Z').getTime()
  const elapsedMs = now.getTime() - start
  const weekMs = 7 * 24 * 60 * 60 * 1000
  return Math.min(1, Math.max(0, elapsedMs / weekMs))
}

export interface LeagueEntry {
  name: string
  xp: number
  isPlayer: boolean
  icon?: string
}

export function computeLeagueBoard(
  divisionIndex: number,
  weekStartISO: string,
  playerName: string,
  playerWeeklyXP: number,
  now: Date = new Date(),
): LeagueEntry[] {
  const league = LEAGUES[Math.min(divisionIndex, LEAGUES.length - 1)]
  const rng = mulberry32(seedFromString(`${weekStartISO}-${league.id}`))
  const fraction = weekFractionElapsed(weekStartISO, now)
  const botCount = LEAGUE_SIZE - 1
  const shuffledNames = [...BOT_NAMES].sort(() => rng() - 0.5).slice(0, botCount)

  const entries: LeagueEntry[] = shuffledNames.map((name) => {
    const finalPace = league.botPaceMin + rng() * (league.botPaceMax - league.botPaceMin)
    // bots progress non-linearly through the week with a bit of jitter so it feels alive
    const jitter = 0.85 + rng() * 0.3
    const xp = Math.round(finalPace * Math.min(1, fraction * jitter) * (0.9 + rng() * 0.2))
    return { name, xp: Math.max(0, xp), isPlayer: false }
  })

  entries.push({ name: playerName, xp: playerWeeklyXP, isPlayer: true })
  entries.sort((a, b) => b.xp - a.xp)
  return entries
}
