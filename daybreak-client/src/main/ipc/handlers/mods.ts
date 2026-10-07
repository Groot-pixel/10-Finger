import { ipcMain, app, dialog } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/ipc-channels'
import {
  modInstallRequestSchema,
  modRemoveRequestSchema,
  modSearchQuerySchema,
  modToggleRequestSchema,
  profileIdSchema
} from '@shared/schemas'
import { respond, validated } from '../respond'
import * as modsService from '../../services/mods/modsService'
import { importCurseForgeModpackZip, importMrpackFile } from '../../services/mods/modpackImport'
import { getMainWindow } from '../../windows/mainWindow'

const platformAndProjectSchema = z.object({
  platform: z.enum(['modrinth', 'curseforge']),
  projectId: z.string().min(1),
  profileId: profileIdSchema
})

export function registerModHandlers(): void {
  ipcMain.handle(IPC.modsSearch, (_event, query: unknown) =>
    validated(modSearchQuerySchema, query, (safeQuery) => modsService.search(safeQuery, app.getVersion()))
  )

  ipcMain.handle(IPC.modsListVersions, (_event, platform: unknown, projectId: unknown, profileId: unknown) =>
    validated(platformAndProjectSchema, { platform, projectId, profileId }, (safe) =>
      modsService.listVersions(safe.platform, safe.projectId, safe.profileId, app.getVersion())
    )
  )

  ipcMain.handle(
    IPC.modsInstall,
    (_event, profileId: unknown, platform: unknown, projectId: unknown, versionId: unknown) =>
      validated(modInstallRequestSchema, { profileId, platform, projectId, versionId }, (safe) =>
        modsService.installMod(safe.profileId, safe.platform, safe.projectId, safe.versionId, app.getVersion())
      )
  )

  ipcMain.handle(IPC.modsListInstalled, (_event, profileId: unknown) =>
    validated(profileIdSchema, profileId, (safeId) => modsService.listInstalled(safeId))
  )

  ipcMain.handle(IPC.modsToggle, (_event, profileId: unknown, modId: unknown, enabled: unknown) =>
    validated(modToggleRequestSchema, { profileId, modId, enabled }, (safe) =>
      modsService.toggleMod(safe.profileId, safe.modId, safe.enabled)
    )
  )

  ipcMain.handle(IPC.modsRemove, (_event, profileId: unknown, modId: unknown) =>
    validated(modRemoveRequestSchema, { profileId, modId }, (safe) => modsService.removeMod(safe.profileId, safe.modId))
  )

  ipcMain.handle(IPC.modsAddManual, (_event, profileId: unknown) =>
    respond(async () => {
      const idResult = profileIdSchema.safeParse(profileId)
      if (!idResult.success) throw new Error('Ungültige Profil-ID')
      const window = getMainWindow()
      if (!window) throw new Error('Kein Fenster verfügbar')
      const result = await dialog.showOpenDialog(window, {
        title: 'Mod-Datei hinzufügen',
        properties: ['openFile'],
        filters: [{ name: 'Mod-Datei', extensions: ['jar'] }]
      })
      if (result.canceled || result.filePaths.length === 0) throw new Error('Abgebrochen')
      return modsService.addManualMod(idResult.data, result.filePaths[0] as string)
    })
  )

  ipcMain.handle(IPC.modsCheckUpdates, (_event, profileId: unknown) =>
    validated(profileIdSchema, profileId, (safeId) => modsService.checkForUpdates(safeId, app.getVersion()))
  )

  ipcMain.handle(IPC.modsUpdateAll, (_event, profileId: unknown) =>
    validated(profileIdSchema, profileId, (safeId) => modsService.updateAllMods(safeId, app.getVersion()))
  )

  ipcMain.handle(IPC.modsImportModpack, () =>
    respond(async () => {
      const window = getMainWindow()
      if (!window) throw new Error('Kein Fenster verfügbar')
      const result = await dialog.showOpenDialog(window, {
        title: 'Modpack importieren',
        properties: ['openFile'],
        filters: [{ name: 'Modpack', extensions: ['mrpack', 'zip'] }]
      })
      if (result.canceled || result.filePaths.length === 0) throw new Error('Abgebrochen')
      const filePath = result.filePaths[0] as string
      if (filePath.endsWith('.mrpack')) {
        return importMrpackFile(filePath)
      }
      return importCurseForgeModpackZip(filePath)
    })
  )

  ipcMain.handle(IPC.modsIsCurseForgeEnabled, () => modsService.isCurseForgeEnabled())
}
