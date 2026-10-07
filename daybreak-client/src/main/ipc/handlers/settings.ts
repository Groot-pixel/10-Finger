import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { appSettingsInputSchema } from '@shared/schemas'
import { respond, validated } from '../respond'
import {
  getSettings,
  pickGameDirectory,
  pickJavaExecutable,
  recommendedRamMb,
  scanJava,
  updateSettings
} from '../../services/settings/settingsService'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.settingsGet, () => getSettings())

  ipcMain.handle(IPC.settingsUpdate, (_event, patch: unknown) =>
    validated(appSettingsInputSchema, patch, (safePatch) => updateSettings(safePatch))
  )

  ipcMain.handle(IPC.settingsScanJava, () => respond(() => scanJava()))
  ipcMain.handle(IPC.settingsPickJavaPath, () => respond(() => pickJavaExecutable()))
  ipcMain.handle(IPC.settingsPickGameDir, () => respond(() => pickGameDirectory()))
  ipcMain.handle(IPC.settingsRecommendedRamMb, () => recommendedRamMb())
}
