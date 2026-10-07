import type {
  AppSettings,
  ConsoleLogLine,
  CrashSummary,
  InstalledMod,
  LaunchProgressEvent,
  MinecraftAccountProfile,
  ModLockfile,
  ModSearchResult,
  ModVersionOption,
  NewsItem,
  PartnerServer,
  Profile,
  ServerListEntry,
  ServerPingResult,
  SetupWizardState
} from './types'
import type { AppSettingsInput, ModSearchQuery, ProfileInput } from './schemas'

/**
 * Every fallible main-process operation returns an AppResult instead of throwing across the
 * IPC boundary, so the renderer always has a human-readable message to show instead of an
 * unhandled rejection or a silently swallowed error.
 */
export type AppResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export interface DeviceCodePrompt {
  userCode: string
  verificationUri: string
  expiresInSeconds: number
}

export interface JavaScanResult {
  path: string
  version: string
  majorVersion: number
}

export interface DaybreakApi {
  app: {
    getVersion: () => Promise<string>
    getAppName: () => Promise<string>
    openExternal: (url: string) => Promise<AppResult<void>>
    openPath: (path: string) => Promise<AppResult<void>>
    getSetupWizardState: () => Promise<SetupWizardState>
    completeSetupWizard: (state: Partial<SetupWizardState>) => Promise<AppResult<SetupWizardState>>
  }
  settings: {
    get: () => Promise<AppSettings>
    update: (patch: AppSettingsInput) => Promise<AppResult<AppSettings>>
    scanJava: () => Promise<AppResult<JavaScanResult[]>>
    pickJavaPath: () => Promise<AppResult<string | null>>
    pickGameDir: () => Promise<AppResult<string | null>>
    recommendedRamMb: () => Promise<number>
  }
  accounts: {
    list: () => Promise<MinecraftAccountProfile[]>
    /** Resolves as soon as the device code is known; the actual login keeps running - subscribe to onLoginResult for the outcome. */
    startMicrosoftLogin: () => Promise<AppResult<DeviceCodePrompt>>
    cancelMicrosoftLogin: () => Promise<void>
    setActive: (accountId: string) => Promise<AppResult<MinecraftAccountProfile[]>>
    remove: (accountId: string) => Promise<AppResult<MinecraftAccountProfile[]>>
    onLoginResult: (cb: (result: AppResult<MinecraftAccountProfile[]>) => void) => () => void
  }
  profiles: {
    list: () => Promise<Profile[]>
    create: (input: ProfileInput) => Promise<AppResult<Profile>>
    update: (id: string, patch: Partial<ProfileInput>) => Promise<AppResult<Profile>>
    duplicate: (id: string) => Promise<AppResult<Profile>>
    remove: (id: string) => Promise<AppResult<void>>
    exportZip: (id: string) => Promise<AppResult<string>>
    importZip: () => Promise<AppResult<Profile>>
    backupWorld: (profileId: string, worldName: string) => Promise<AppResult<string>>
    listWorlds: (profileId: string) => Promise<AppResult<string[]>>
  }
  launch: {
    start: (profileId: string) => Promise<AppResult<void>>
    stop: (profileId: string) => Promise<AppResult<void>>
    isRunning: (profileId: string) => Promise<boolean>
    onProgress: (cb: (event: LaunchProgressEvent) => void) => () => void
    onConsoleLine: (cb: (event: ConsoleLogLine) => void) => () => void
    onCrash: (cb: (event: CrashSummary) => void) => () => void
  }
  mods: {
    search: (query: ModSearchQuery) => Promise<AppResult<ModSearchResult[]>>
    listVersions: (
      platform: 'modrinth' | 'curseforge',
      projectId: string,
      profileId: string
    ) => Promise<AppResult<ModVersionOption[]>>
    install: (
      profileId: string,
      platform: 'modrinth' | 'curseforge',
      projectId: string,
      versionId: string
    ) => Promise<AppResult<ModLockfile>>
    listInstalled: (profileId: string) => Promise<AppResult<InstalledMod[]>>
    toggle: (profileId: string, modId: string, enabled: boolean) => Promise<AppResult<ModLockfile>>
    remove: (profileId: string, modId: string) => Promise<AppResult<ModLockfile>>
    addManual: (profileId: string) => Promise<AppResult<ModLockfile>>
    checkUpdates: (profileId: string) => Promise<AppResult<InstalledMod[]>>
    updateAll: (profileId: string) => Promise<AppResult<ModLockfile>>
    importModpack: () => Promise<AppResult<Profile>>
    isCurseForgeEnabled: () => Promise<boolean>
  }
  servers: {
    listPartners: () => Promise<PartnerServer[]>
    listNews: () => Promise<NewsItem[]>
    listSaved: () => Promise<ServerListEntry[]>
    addSaved: (entry: Omit<ServerListEntry, 'id'>) => Promise<AppResult<ServerListEntry[]>>
    removeSaved: (id: string) => Promise<AppResult<ServerListEntry[]>>
    ping: (address: string) => Promise<ServerPingResult>
    copyAddress: (address: string) => Promise<void>
  }
  skins: {
    getLibrary: () => Promise<AppResult<string[]>>
    setSkin: (variant: 'classic' | 'slim', source: 'url' | 'file', value: string) => Promise<AppResult<void>>
  }
  screenshots: {
    list: (profileId: string) => Promise<AppResult<string[]>>
    openFolder: (profileId: string) => Promise<AppResult<void>>
  }
  discord: {
    isConnected: () => Promise<boolean>
  }
  update: {
    checkNow: () => Promise<AppResult<{ updateAvailable: boolean; version: string | null }>>
    onStatus: (cb: (status: string) => void) => () => void
  }
}

export const DAYBREAK_BRIDGE_KEY = 'daybreak' as const
