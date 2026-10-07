import { ipcMain, shell, app } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/ipc-channels'
import { APP_NAME } from '@shared/constants'
import { validated } from '../respond'
import { setupWizardStore } from '../../services/storage/setupWizardStore'

const externalUrlSchema = z.string().url().refine((url) => /^https?:\/\//.test(url), {
  message: 'Nur http(s)-Links dürfen extern geöffnet werden'
})

const openPathSchema = z.string().min(1).max(4096)

const setupWizardPatchSchema = z.object({
  completed: z.boolean().optional(),
  language: z.enum(['de', 'en']).nullable().optional(),
  javaPath: z.string().nullable().optional(),
  recommendedRamMb: z.number().nullable().optional()
})

export function registerAppHandlers(): void {
  ipcMain.handle(IPC.appGetVersion, () => app.getVersion())
  ipcMain.handle(IPC.appGetAppName, () => APP_NAME)

  ipcMain.handle(IPC.appOpenExternal, (_event, url: unknown) =>
    validated(externalUrlSchema, url, async (safeUrl) => {
      await shell.openExternal(safeUrl)
    })
  )

  ipcMain.handle(IPC.appOpenPath, (_event, path: unknown) =>
    validated(openPathSchema, path, async (safePath) => {
      const errorMessage = await shell.openPath(safePath)
      if (errorMessage) throw new Error(errorMessage)
    })
  )

  ipcMain.handle(IPC.appGetSetupWizardState, () => setupWizardStore.read())

  ipcMain.handle(IPC.appCompleteSetupWizard, (_event, patch: unknown) =>
    validated(setupWizardPatchSchema, patch, (safePatch) =>
      setupWizardStore.update((current) => ({ ...current, ...safePatch }))
    )
  )
}
