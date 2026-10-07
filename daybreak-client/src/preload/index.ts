import { contextBridge, ipcRenderer } from 'electron'
import { IPC, IPC_EVENTS } from '@shared/ipc-channels'
import { DAYBREAK_BRIDGE_KEY, type DaybreakApi } from '@shared/ipc-api'

/**
 * contextIsolation is enabled and nodeIntegration is disabled (see main/windows/mainWindow.ts),
 * so this is the only surface the renderer ever touches. Every call is a plain invoke/handle
 * round-trip; no Node or Electron object ever crosses the bridge directly.
 */
function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_event: unknown, payload: T): void => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: DaybreakApi = {
  app: {
    getVersion: () => ipcRenderer.invoke(IPC.appGetVersion),
    getAppName: () => ipcRenderer.invoke(IPC.appGetAppName),
    openExternal: (url) => ipcRenderer.invoke(IPC.appOpenExternal, url),
    openPath: (path) => ipcRenderer.invoke(IPC.appOpenPath, path),
    getSetupWizardState: () => ipcRenderer.invoke(IPC.appGetSetupWizardState),
    completeSetupWizard: (state) => ipcRenderer.invoke(IPC.appCompleteSetupWizard, state)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.settingsGet),
    update: (patch) => ipcRenderer.invoke(IPC.settingsUpdate, patch),
    scanJava: () => ipcRenderer.invoke(IPC.settingsScanJava),
    pickJavaPath: () => ipcRenderer.invoke(IPC.settingsPickJavaPath),
    pickGameDir: () => ipcRenderer.invoke(IPC.settingsPickGameDir),
    recommendedRamMb: () => ipcRenderer.invoke(IPC.settingsRecommendedRamMb)
  },
  accounts: {
    list: () => ipcRenderer.invoke(IPC.accountsList),
    startMicrosoftLogin: () => ipcRenderer.invoke(IPC.accountsStartMicrosoftLogin),
    cancelMicrosoftLogin: () => ipcRenderer.invoke(IPC.accountsCancelMicrosoftLogin),
    setActive: (accountId) => ipcRenderer.invoke(IPC.accountsSetActive, accountId),
    remove: (accountId) => ipcRenderer.invoke(IPC.accountsRemove, accountId)
  },
  profiles: {
    list: () => ipcRenderer.invoke(IPC.profilesList),
    create: (input) => ipcRenderer.invoke(IPC.profilesCreate, input),
    update: (id, patch) => ipcRenderer.invoke(IPC.profilesUpdate, id, patch),
    duplicate: (id) => ipcRenderer.invoke(IPC.profilesDuplicate, id),
    remove: (id) => ipcRenderer.invoke(IPC.profilesRemove, id),
    exportZip: (id) => ipcRenderer.invoke(IPC.profilesExportZip, id),
    importZip: () => ipcRenderer.invoke(IPC.profilesImportZip),
    backupWorld: (profileId, worldName) =>
      ipcRenderer.invoke(IPC.profilesBackupWorld, profileId, worldName),
    listWorlds: (profileId) => ipcRenderer.invoke(IPC.profilesListWorlds, profileId)
  },
  launch: {
    start: (profileId) => ipcRenderer.invoke(IPC.launchStart, profileId),
    stop: (profileId) => ipcRenderer.invoke(IPC.launchStop, profileId),
    isRunning: (profileId) => ipcRenderer.invoke(IPC.launchIsRunning, profileId),
    onProgress: (cb) => subscribe(IPC_EVENTS.launchProgress, cb),
    onConsoleLine: (cb) => subscribe(IPC_EVENTS.launchConsoleLine, cb),
    onCrash: (cb) => subscribe(IPC_EVENTS.launchCrash, cb)
  },
  mods: {
    search: (query) => ipcRenderer.invoke(IPC.modsSearch, query),
    listVersions: (platform, projectId, profileId) =>
      ipcRenderer.invoke(IPC.modsListVersions, platform, projectId, profileId),
    install: (profileId, platform, projectId, versionId) =>
      ipcRenderer.invoke(IPC.modsInstall, profileId, platform, projectId, versionId),
    listInstalled: (profileId) => ipcRenderer.invoke(IPC.modsListInstalled, profileId),
    toggle: (profileId, modId, enabled) =>
      ipcRenderer.invoke(IPC.modsToggle, profileId, modId, enabled),
    remove: (profileId, modId) => ipcRenderer.invoke(IPC.modsRemove, profileId, modId),
    addManual: (profileId) => ipcRenderer.invoke(IPC.modsAddManual, profileId),
    checkUpdates: (profileId) => ipcRenderer.invoke(IPC.modsCheckUpdates, profileId),
    updateAll: (profileId) => ipcRenderer.invoke(IPC.modsUpdateAll, profileId),
    importModpack: () => ipcRenderer.invoke(IPC.modsImportModpack),
    isCurseForgeEnabled: () => ipcRenderer.invoke(IPC.modsIsCurseForgeEnabled)
  },
  servers: {
    listPartners: () => ipcRenderer.invoke(IPC.serversListPartners),
    listNews: () => ipcRenderer.invoke(IPC.serversListNews),
    listSaved: () => ipcRenderer.invoke(IPC.serversListSaved),
    addSaved: (entry) => ipcRenderer.invoke(IPC.serversAddSaved, entry),
    removeSaved: (id) => ipcRenderer.invoke(IPC.serversRemoveSaved, id),
    ping: (address) => ipcRenderer.invoke(IPC.serversPing, address),
    copyAddress: (address) => ipcRenderer.invoke(IPC.serversCopyAddress, address)
  },
  skins: {
    getLibrary: () => ipcRenderer.invoke(IPC.skinsGetLibrary),
    setSkin: (variant, source, value) => ipcRenderer.invoke(IPC.skinsSetSkin, variant, source, value)
  },
  screenshots: {
    list: (profileId) => ipcRenderer.invoke(IPC.screenshotsList, profileId),
    openFolder: (profileId) => ipcRenderer.invoke(IPC.screenshotsOpenFolder, profileId)
  },
  discord: {
    isConnected: () => ipcRenderer.invoke(IPC.discordIsConnected)
  },
  update: {
    checkNow: () => ipcRenderer.invoke(IPC.updateCheckNow),
    onStatus: (cb) => subscribe(IPC_EVENTS.updateStatus, cb)
  }
}

contextBridge.exposeInMainWorld(DAYBREAK_BRIDGE_KEY, api)
