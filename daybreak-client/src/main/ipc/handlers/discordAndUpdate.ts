import { ipcMain } from 'electron'
import { IPC, IPC_EVENTS } from '@shared/ipc-channels'
import { respond } from '../respond'
import { isDiscordConnected } from '../../services/extras/discordService'
import { checkForUpdatesNow, onUpdateStatus } from '../../services/extras/updateService'
import { getMainWindow } from '../../windows/mainWindow'

export function registerDiscordAndUpdateHandlers(): void {
  ipcMain.handle(IPC.discordIsConnected, () => isDiscordConnected())

  ipcMain.handle(IPC.updateCheckNow, () => respond(() => checkForUpdatesNow()))

  onUpdateStatus((status) => {
    getMainWindow()?.webContents.send(IPC_EVENTS.updateStatus, status)
  })
}
