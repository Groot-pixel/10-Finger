import { appSettingsSchema } from '@shared/schemas'
import type { AppSettings } from '@shared/types'
import { DEFAULT_RAM_MB } from '@shared/constants'
import { JsonStore } from './jsonStore'
import { paths, getDataDir } from './paths'
import { join } from 'node:path'

function defaultSettings(): AppSettings {
  return {
    language: 'de',
    defaultRamMb: DEFAULT_RAM_MB,
    javaPath: null,
    defaultGameDir: join(getDataDir(), '..', 'profiles'),
    microsoftClientIdOverride: null,
    hasCurseForgeApiKey: false,
    discordRpcEnabled: true,
    postLaunchBehavior: 'keepOpen',
    autoUpdateEnabled: true,
    closeConsoleOnCrashOnly: false
  }
}

export const settingsStore = new JsonStore<AppSettings>(
  paths.settingsFile(),
  appSettingsSchema,
  defaultSettings
)
