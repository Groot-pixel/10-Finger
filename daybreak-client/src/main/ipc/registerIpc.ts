import { IPC_EVENTS } from '@shared/ipc-channels'
import { getMainWindow } from '../windows/mainWindow'
import { launchEvents } from '../services/minecraft/launchEvents'
import { registerAppHandlers } from './handlers/app'
import { registerSettingsHandlers } from './handlers/settings'
import { registerAccountHandlers } from './handlers/accounts'
import { registerProfileHandlers } from './handlers/profiles'
import { registerLaunchHandlers } from './handlers/launch'
import { registerModHandlers } from './handlers/mods'
import { registerServerHandlers } from './handlers/servers'
import { registerSkinHandlers } from './handlers/skins'
import { registerScreenshotHandlers } from './handlers/screenshots'
import { registerDiscordAndUpdateHandlers } from './handlers/discordAndUpdate'
import { registerDiscordPresence } from '../services/extras/discordService'

export function registerAllIpcHandlers(): void {
  registerAppHandlers()
  registerSettingsHandlers()
  registerAccountHandlers()
  registerProfileHandlers()
  registerLaunchHandlers()
  registerModHandlers()
  registerServerHandlers()
  registerSkinHandlers()
  registerScreenshotHandlers()
  registerDiscordAndUpdateHandlers()

  launchEvents.on('progress', (event) => getMainWindow()?.webContents.send(IPC_EVENTS.launchProgress, event))
  launchEvents.on('consoleLine', (event) => getMainWindow()?.webContents.send(IPC_EVENTS.launchConsoleLine, event))
  launchEvents.on('crash', (event) => getMainWindow()?.webContents.send(IPC_EVENTS.launchCrash, event))

  registerDiscordPresence()
}
