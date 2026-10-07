import { ipcMain } from 'electron'
import { skinChangeRequestSchema } from '@shared/schemas'
import { IPC } from '@shared/ipc-channels'
import { respond, validated } from '../respond'
import { listSkinLibrary, setActiveSkin } from '../../services/extras/skinService'
import { accountStore } from '../../services/storage/accountStore'
import { getValidMinecraftAccessToken } from '../../services/auth/accountService'

export function registerSkinHandlers(): void {
  ipcMain.handle(IPC.skinsGetLibrary, () => respond(() => listSkinLibrary()))

  ipcMain.handle(IPC.skinsSetSkin, (_event, variant: unknown, source: unknown, value: unknown) =>
    validated(skinChangeRequestSchema, { variant, source, value }, async (safe) => {
      const account = await accountStore.getActive()
      if (!account) throw new Error('Kein Konto angemeldet')
      const accessToken = await getValidMinecraftAccessToken(account)
      await setActiveSkin(accessToken, safe.variant, safe.source, safe.value)
    })
  )
}
