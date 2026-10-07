import { totalmem } from 'node:os'
import { dialog } from 'electron'
import type { AppSettings } from '@shared/types'
import type { AppSettingsInput } from '@shared/schemas'
import { DEFAULT_RAM_MB, MIN_RAM_MB } from '@shared/constants'
import { settingsStore } from '../storage/settingsStore'
import { getMainWindow } from '../../windows/mainWindow'
import { scanInstalledJava, type DetectedJava } from '../minecraft/javaLocator'
import { getCurseForgeApiKey, setCurseForgeApiKey } from '../mods/modsService'

export function recommendedRamMb(): number {
  const totalMb = totalmem() / (1024 * 1024)
  const recommended = Math.round(totalMb / 4 / 512) * 512
  return Math.min(Math.max(recommended, MIN_RAM_MB), DEFAULT_RAM_MB * 2)
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await settingsStore.read()
  const hasCurseForgeApiKey = (await getCurseForgeApiKey()) !== null
  return { ...settings, hasCurseForgeApiKey }
}

export async function updateSettings(patch: AppSettingsInput): Promise<AppSettings> {
  const { curseForgeApiKey, ...rest } = patch
  if (curseForgeApiKey !== undefined) {
    await setCurseForgeApiKey(curseForgeApiKey)
  }
  const updated = await settingsStore.update((current) => ({ ...current, ...rest }))
  const hasCurseForgeApiKey = (await getCurseForgeApiKey()) !== null
  return { ...updated, hasCurseForgeApiKey }
}

export async function scanJava(): Promise<DetectedJava[]> {
  return scanInstalledJava()
}

export async function pickJavaExecutable(): Promise<string | null> {
  const window = getMainWindow()
  if (!window) return null
  const result = await dialog.showOpenDialog(window, {
    title: 'Java-Pfad auswählen',
    properties: ['openFile'],
    filters: process.platform === 'win32' ? [{ name: 'Java', extensions: ['exe'] }] : []
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0] ?? null
}

export async function pickGameDirectory(): Promise<string | null> {
  const window = getMainWindow()
  if (!window) return null
  const result = await dialog.showOpenDialog(window, {
    title: 'Spielordner auswählen',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0] ?? null
}
