import { ipcMain, dialog } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/ipc-channels'
import { profileIdSchema, profileInputSchema, profilePatchSchema } from '@shared/schemas'
import { respond, validated } from '../respond'
import { profileStore } from '../../services/storage/profileStore'
import {
  backupWorld,
  createProfile,
  duplicateProfile,
  exportProfileZip,
  importProfileZip,
  listWorlds
} from '../../services/profiles/profilesService'
import { getMainWindow } from '../../windows/mainWindow'

export function registerProfileHandlers(): void {
  ipcMain.handle(IPC.profilesList, () => profileStore.list())

  ipcMain.handle(IPC.profilesCreate, (_event, input: unknown) =>
    validated(profileInputSchema, input, (safeInput) => createProfile(safeInput))
  )

  ipcMain.handle(IPC.profilesUpdate, (_event, id: unknown, patch: unknown) =>
    respond(async () => {
      const idResult = profileIdSchema.safeParse(id)
      if (!idResult.success) throw new Error('Ungültige Profil-ID')
      const patchResult = profilePatchSchema.safeParse(patch)
      if (!patchResult.success) throw new Error(`Ungültige Profildaten: ${patchResult.error.message}`)
      return profileStore.update(idResult.data, patchResult.data)
    })
  )

  ipcMain.handle(IPC.profilesDuplicate, (_event, id: unknown) =>
    validated(profileIdSchema, id, (safeId) => duplicateProfile(safeId))
  )

  ipcMain.handle(IPC.profilesRemove, (_event, id: unknown) =>
    validated(profileIdSchema, id, (safeId) => profileStore.remove(safeId))
  )

  ipcMain.handle(IPC.profilesExportZip, (_event, id: unknown) =>
    respond(async () => {
      const idResult = profileIdSchema.safeParse(id)
      if (!idResult.success) throw new Error('Ungültige Profil-ID')
      const profile = await profileStore.get(idResult.data)
      if (!profile) throw new Error('Profil wurde nicht gefunden')
      const window = getMainWindow()
      const result = window
        ? await dialog.showSaveDialog(window, {
            title: 'Profil exportieren',
            defaultPath: `${profile.name}.zip`,
            filters: [{ name: 'Daybreak-Profil', extensions: ['zip'] }]
          })
        : { canceled: true, filePath: undefined }
      if (result.canceled || !result.filePath) throw new Error('Export abgebrochen')
      return exportProfileZip(idResult.data, result.filePath)
    })
  )

  ipcMain.handle(IPC.profilesImportZip, () =>
    respond(async () => {
      const window = getMainWindow()
      if (!window) throw new Error('Kein Fenster verfügbar')
      const result = await dialog.showOpenDialog(window, {
        title: 'Profil importieren',
        properties: ['openFile'],
        filters: [{ name: 'Daybreak-Profil / Modpack', extensions: ['zip', 'mrpack'] }]
      })
      if (result.canceled || result.filePaths.length === 0) throw new Error('Import abgebrochen')
      return importProfileZip(result.filePaths[0] as string)
    })
  )

  ipcMain.handle(IPC.profilesBackupWorld, (_event, profileId: unknown, worldName: unknown) =>
    respond(async () => {
      const idResult = profileIdSchema.safeParse(profileId)
      const nameResult = z.string().min(1).max(255).safeParse(worldName)
      if (!idResult.success || !nameResult.success) throw new Error('Ungültige Eingabe')
      return backupWorld(idResult.data, nameResult.data)
    })
  )

  ipcMain.handle(IPC.profilesListWorlds, (_event, profileId: unknown) =>
    validated(profileIdSchema, profileId, (safeId) => listWorlds(safeId))
  )
}
