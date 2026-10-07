/**
 * Flat invoke-channel names shared by main (ipcMain.handle) and preload (ipcRenderer.invoke).
 * Keeping them as one object avoids silent typos between the two sides of the bridge.
 */
export const IPC = {
  appGetVersion: 'app:getVersion',
  appGetAppName: 'app:getAppName',
  appOpenExternal: 'app:openExternal',
  appOpenPath: 'app:openPath',
  appGetSetupWizardState: 'app:getSetupWizardState',
  appCompleteSetupWizard: 'app:completeSetupWizard',

  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  settingsScanJava: 'settings:scanJava',
  settingsPickJavaPath: 'settings:pickJavaPath',
  settingsPickGameDir: 'settings:pickGameDir',
  settingsRecommendedRamMb: 'settings:recommendedRamMb',

  accountsList: 'accounts:list',
  accountsStartMicrosoftLogin: 'accounts:startMicrosoftLogin',
  accountsCancelMicrosoftLogin: 'accounts:cancelMicrosoftLogin',
  accountsSetActive: 'accounts:setActive',
  accountsRemove: 'accounts:remove',

  profilesList: 'profiles:list',
  profilesCreate: 'profiles:create',
  profilesUpdate: 'profiles:update',
  profilesDuplicate: 'profiles:duplicate',
  profilesRemove: 'profiles:remove',
  profilesExportZip: 'profiles:exportZip',
  profilesImportZip: 'profiles:importZip',
  profilesBackupWorld: 'profiles:backupWorld',
  profilesListWorlds: 'profiles:listWorlds',

  launchStart: 'launch:start',
  launchStop: 'launch:stop',
  launchIsRunning: 'launch:isRunning',

  modsSearch: 'mods:search',
  modsListVersions: 'mods:listVersions',
  modsInstall: 'mods:install',
  modsListInstalled: 'mods:listInstalled',
  modsToggle: 'mods:toggle',
  modsRemove: 'mods:remove',
  modsAddManual: 'mods:addManual',
  modsCheckUpdates: 'mods:checkUpdates',
  modsUpdateAll: 'mods:updateAll',
  modsImportModpack: 'mods:importModpack',
  modsIsCurseForgeEnabled: 'mods:isCurseForgeEnabled',

  serversListPartners: 'servers:listPartners',
  serversListNews: 'servers:listNews',
  serversListSaved: 'servers:listSaved',
  serversAddSaved: 'servers:addSaved',
  serversRemoveSaved: 'servers:removeSaved',
  serversPing: 'servers:ping',
  serversCopyAddress: 'servers:copyAddress',

  skinsGetLibrary: 'skins:getLibrary',
  skinsSetSkin: 'skins:setSkin',

  screenshotsList: 'screenshots:list',
  screenshotsOpenFolder: 'screenshots:openFolder',

  discordIsConnected: 'discord:isConnected',

  updateCheckNow: 'update:checkNow'
} as const

/** Push-event channels: main -> renderer only, no invoke/handle pairing. */
export const IPC_EVENTS = {
  launchProgress: 'event:launch:progress',
  launchConsoleLine: 'event:launch:consoleLine',
  launchCrash: 'event:launch:crash',
  updateStatus: 'event:update:status',
  accountsLoginResult: 'event:accounts:loginResult'
} as const
