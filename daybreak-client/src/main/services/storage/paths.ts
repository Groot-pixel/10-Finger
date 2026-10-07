import { app } from 'electron'
import { join } from 'node:path'

/** Centralised layout of everything Daybreak Client stores on disk, rooted at Electron's userData dir. */
export function getUserDataDir(): string {
  return app.getPath('userData')
}

export function getDataDir(): string {
  return join(getUserDataDir(), 'data')
}

export const paths = {
  profilesFile: () => join(getDataDir(), 'profiles.json'),
  accountsFile: () => join(getDataDir(), 'accounts.json'),
  settingsFile: () => join(getDataDir(), 'settings.json'),
  serversFile: () => join(getDataDir(), 'servers.json'),
  setupWizardFile: () => join(getDataDir(), 'setup-wizard.json'),
  secretVaultFile: () => join(getDataDir(), 'vault.bin'),
  lockfilesDir: () => join(getDataDir(), 'lockfiles'),
  lockfileFor: (profileId: string) => join(getDataDir(), 'lockfiles', `${profileId}.json`),
  newsFile: () => join(getDataDir(), 'news.json'),
  partnerServersFile: () => join(getDataDir(), 'partner-servers.json'),
  defaultGameDirRoot: () => join(getUserDataDir(), 'profiles'),
  gameDirFor: (profileId: string) => join(getUserDataDir(), 'profiles', profileId),
  javaRuntimesDir: () => join(getUserDataDir(), 'runtimes'),
  librariesCacheDir: () => join(getUserDataDir(), 'cache', 'libraries'),
  assetsCacheDir: () => join(getUserDataDir(), 'cache', 'assets'),
  versionsCacheDir: () => join(getUserDataDir(), 'cache', 'versions'),
  skinsLibraryDir: () => join(getUserDataDir(), 'skins'),
  logsDir: () => join(getUserDataDir(), 'logs')
}
