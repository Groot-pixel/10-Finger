import { ipcMain, clipboard } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/ipc-channels'
import { serverListEntryInputSchema } from '@shared/schemas'
import { respond, validated } from '../respond'
import { serverStore } from '../../services/storage/serverStore'
import { pingJavaServer } from '../../services/extras/serverPing'

const idSchema = z.string().uuid()
const addressSchema = z.string().min(1).max(256)

export function registerServerHandlers(): void {
  ipcMain.handle(IPC.serversListPartners, () => serverStore.listPartners())
  ipcMain.handle(IPC.serversListNews, () => serverStore.listNews())
  ipcMain.handle(IPC.serversListSaved, () => serverStore.listSaved())

  ipcMain.handle(IPC.serversAddSaved, (_event, entry: unknown) =>
    validated(serverListEntryInputSchema, entry, (safe) => serverStore.addSaved(safe))
  )

  ipcMain.handle(IPC.serversRemoveSaved, (_event, id: unknown) =>
    validated(idSchema, id, (safeId) => serverStore.removeSaved(safeId))
  )

  ipcMain.handle(IPC.serversPing, (_event, address: unknown) =>
    respond(async () => {
      const result = addressSchema.safeParse(address)
      if (!result.success) {
        return { online: false, playersOnline: null, playersMax: null, motd: null, versionName: null, latencyMs: null, error: 'Ungültige Adresse' }
      }
      return pingJavaServer(result.data)
    }).then((r) => (r.ok ? r.data : { online: false, playersOnline: null, playersMax: null, motd: null, versionName: null, latencyMs: null, error: r.error.message }))
  )

  ipcMain.handle(IPC.serversCopyAddress, (_event, address: unknown) => {
    const result = addressSchema.safeParse(address)
    if (result.success) clipboard.writeText(result.data)
  })
}
