import { DiscordRpcClient } from './discordRpc'
import { settingsStore } from '../storage/settingsStore'
import { launchEvents } from '../minecraft/launchEvents'

const DISCORD_CLIENT_ID = process.env.DAYBREAK_DISCORD_CLIENT_ID ?? ''

let client: DiscordRpcClient | null = null
let sessionStartedAt: number | null = null

async function ensureClient(): Promise<DiscordRpcClient | null> {
  if (!DISCORD_CLIENT_ID) return null
  const settings = await settingsStore.read()
  if (!settings.discordRpcEnabled) return null
  if (!client) {
    client = new DiscordRpcClient(DISCORD_CLIENT_ID)
    await client.connect()
  }
  return client.isConnected() ? client : null
}

export function isDiscordConnected(): boolean {
  return client?.isConnected() ?? false
}

/** Wires Discord Rich Presence to the launch event bus: idle on load, "Spielt Minecraft" while running. */
export function registerDiscordPresence(): void {
  launchEvents.on('progress', (event) => {
    void (async () => {
      const rpc = await ensureClient()
      if (!rpc) return
      if (event.phase === 'running' && !sessionStartedAt) {
        sessionStartedAt = Date.now()
        rpc.setActivity('Spielt Minecraft', 'Mit Daybreak Client', sessionStartedAt)
      }
      if (event.phase === 'exited') {
        sessionStartedAt = null
        rpc.setActivity('Im Launcher', 'Bereit zum Spielen', Date.now())
      }
    })()
  })
}
