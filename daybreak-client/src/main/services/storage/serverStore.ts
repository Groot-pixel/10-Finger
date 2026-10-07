import { randomUUID } from 'node:crypto'
import {
  newsFileSchema,
  partnerServersFileSchema,
  serversFileSchema
} from '@shared/schemas'
import type { NewsItem, PartnerServer, ServerListEntry } from '@shared/types'
import { JsonStore } from './jsonStore'
import { paths } from './paths'

const savedServersStore = new JsonStore<{ servers: ServerListEntry[] }>(
  paths.serversFile(),
  serversFileSchema,
  () => ({ servers: [] })
)

const partnerServersStore = new JsonStore<{ servers: PartnerServer[] }>(
  paths.partnerServersFile(),
  partnerServersFileSchema,
  () => ({
    servers: [
      {
        id: 'daybreak-hub',
        name: 'Daybreak Hub',
        address: 'hub.daybreakclient.example',
        description: 'Der offizielle Community-Server des Daybreak Clients.',
        bannerUrl: null,
        edition: 'java'
      }
    ]
  })
)

const newsStore = new JsonStore<{ items: NewsItem[] }>(paths.newsFile(), newsFileSchema, () => ({
  items: [
    {
      id: 'welcome',
      title: 'Willkommen bei Daybreak Client',
      summary: 'Dein neuer Launcher ist einsatzbereit. Viel Spaß beim Spielen!',
      url: null,
      publishedAt: new Date().toISOString(),
      imageUrl: null
    }
  ]
}))

export const serverStore = {
  async listSaved(): Promise<ServerListEntry[]> {
    return (await savedServersStore.read()).servers
  },
  async addSaved(entry: Omit<ServerListEntry, 'id'>): Promise<ServerListEntry[]> {
    const result = await savedServersStore.update((file) => ({
      servers: [...file.servers, { ...entry, id: randomUUID() }]
    }))
    return result.servers
  },
  async removeSaved(id: string): Promise<ServerListEntry[]> {
    const result = await savedServersStore.update((file) => ({
      servers: file.servers.filter((s) => s.id !== id)
    }))
    return result.servers
  },
  async listPartners(): Promise<PartnerServer[]> {
    return (await partnerServersStore.read()).servers
  },
  async listNews(): Promise<NewsItem[]> {
    return (await newsStore.read()).items
  }
}
