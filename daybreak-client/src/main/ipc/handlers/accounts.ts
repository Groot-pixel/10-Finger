import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC, IPC_EVENTS } from '@shared/ipc-channels'
import { respond, validated, toErrorPayload } from '../respond'
import { accountStore } from '../../services/storage/accountStore'
import { cancelMicrosoftLogin, startMicrosoftLogin } from '../../services/auth/accountService'
import { getMainWindow } from '../../windows/mainWindow'
import type { AppResult, DeviceCodePrompt } from '@shared/ipc-api'
import type { MinecraftAccountProfile } from '@shared/types'

const accountIdSchema = z.string().uuid()

function sendLoginResult(result: AppResult<MinecraftAccountProfile[]>): void {
  getMainWindow()?.webContents.send(IPC_EVENTS.accountsLoginResult, result)
}

export function registerAccountHandlers(): void {
  ipcMain.handle(IPC.accountsList, () => accountStore.list())

  ipcMain.handle(IPC.accountsStartMicrosoftLogin, () =>
    respond<DeviceCodePrompt>(
      () =>
        new Promise<DeviceCodePrompt>((resolveWithPrompt, rejectBeforePrompt) => {
          let promptSent = false
          startMicrosoftLogin((prompt) => {
            promptSent = true
            resolveWithPrompt(prompt)
          })
            .then(async () => {
              sendLoginResult({ ok: true, data: await accountStore.list() })
            })
            .catch((error: unknown) => {
              if (!promptSent) {
                rejectBeforePrompt(error)
                return
              }
              sendLoginResult({ ok: false, error: toErrorPayload(error) })
            })
        })
    )
  )

  ipcMain.handle(IPC.accountsCancelMicrosoftLogin, () => {
    cancelMicrosoftLogin()
  })

  ipcMain.handle(IPC.accountsSetActive, (_event, accountId: unknown) =>
    validated(accountIdSchema, accountId, (id) => accountStore.setActive(id))
  )

  ipcMain.handle(IPC.accountsRemove, (_event, accountId: unknown) =>
    validated(accountIdSchema, accountId, (id) => accountStore.remove(id))
  )
}
