// electron-updater ships only a CommonJS build with no named ESM exports, so it must be
// imported as a default and destructured - a plain named import throws at runtime.
import electronUpdaterPkg from 'electron-updater'
import { settingsStore } from '../storage/settingsStore'

const { autoUpdater } = electronUpdaterPkg

export interface UpdateCheckResult {
  updateAvailable: boolean
  version: string | null
}

let statusListener: ((status: string) => void) | null = null

export function onUpdateStatus(cb: (status: string) => void): void {
  statusListener = cb
}

function notify(status: string): void {
  statusListener?.(status)
}

export function initAutoUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.on('checking-for-update', () => notify('Suche nach Updates ...'))
  autoUpdater.on('update-available', (info) => notify(`Update verfügbar: ${info.version}`))
  autoUpdater.on('update-not-available', () => notify('Kein Update verfügbar'))
  autoUpdater.on('error', (error) => notify(`Update-Fehler: ${error.message}`))
  autoUpdater.on('download-progress', (progress) =>
    notify(`Lade Update herunter: ${Math.round(progress.percent)}%`)
  )
  autoUpdater.on('update-downloaded', (info) => notify(`Update ${info.version} heruntergeladen, wird beim nächsten Neustart installiert`))
}

export async function checkForUpdatesNow(): Promise<UpdateCheckResult> {
  const settings = await settingsStore.read()
  if (!settings.autoUpdateEnabled) {
    return { updateAvailable: false, version: null }
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    const version = result?.updateInfo.version ?? null
    const currentVersion = autoUpdater.currentVersion.version
    return { updateAvailable: version !== null && version !== currentVersion, version }
  } catch (error) {
    // No publish feed configured yet (no GitHub Release / update server) - this is expected
    // until the project has its first published release, not a crash-worthy failure.
    notify(error instanceof Error ? `Update-Prüfung nicht möglich: ${error.message}` : 'Update-Prüfung nicht möglich')
    return { updateAvailable: false, version: null }
  }
}
