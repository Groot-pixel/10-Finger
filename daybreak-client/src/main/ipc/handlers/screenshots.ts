import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { profileIdSchema } from '@shared/schemas'
import { validated } from '../respond'
import { listScreenshots, openScreenshotsFolder } from '../../services/extras/screenshotService'

export function registerScreenshotHandlers(): void {
  ipcMain.handle(IPC.screenshotsList, (_event, profileId: unknown) =>
    validated(profileIdSchema, profileId, (safeId) => listScreenshots(safeId))
  )
  ipcMain.handle(IPC.screenshotsOpenFolder, (_event, profileId: unknown) =>
    validated(profileIdSchema, profileId, (safeId) => openScreenshotsFolder(safeId))
  )
}
