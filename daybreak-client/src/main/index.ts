import { app, BrowserWindow } from 'electron'
import { APP_ID } from '@shared/constants'
import { createMainWindow } from './windows/mainWindow'
import { registerAllIpcHandlers } from './ipc/registerIpc'
import { initAutoUpdater } from './services/extras/updateService'

app.setAppUserModelId(APP_ID)

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows()
    const existing = windows[0]
    if (existing) {
      if (existing.isMinimized()) existing.restore()
      existing.focus()
    }
  })

  app.whenReady().then(() => {
    registerAllIpcHandlers()
    initAutoUpdater()
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
