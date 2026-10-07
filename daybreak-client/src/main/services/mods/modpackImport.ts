import AdmZip from 'adm-zip'
import { join } from 'node:path'
import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { InstalledMod, JavaLoader, Profile } from '@shared/types'
import { CURSEFORGE_API_BASE } from '@shared/constants'
import { downloadFile } from '../network/downloader'
import { fetchJson } from '../network/httpClient'
import { profileStore } from '../storage/profileStore'
import { lockfileStore } from '../storage/lockfileStore'
import { paths } from '../storage/paths'
import { resolveWithinBase } from '../storage/safePath'
import { getCurseForgeApiKey } from './modsService'

interface MrpackIndex {
  name: string
  versionId: string
  dependencies: Record<string, string>
  files: Array<{
    path: string
    hashes: { sha1: string }
    downloads: string[]
    fileSize: number
    env?: { client?: string }
  }>
}

function detectLoaderFromDependencies(dependencies: Record<string, string>): { loader: JavaLoader; loaderVersion: string | null } {
  if (dependencies['fabric-loader']) return { loader: 'fabric', loaderVersion: dependencies['fabric-loader'] }
  if (dependencies['quilt-loader']) return { loader: 'quilt', loaderVersion: dependencies['quilt-loader'] }
  if (dependencies['forge']) return { loader: 'forge', loaderVersion: dependencies['forge'] }
  if (dependencies['neoforge']) return { loader: 'neoforge', loaderVersion: dependencies['neoforge'] }
  return { loader: 'vanilla', loaderVersion: null }
}

async function extractOverrides(zip: AdmZip, gameDir: string): Promise<void> {
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    const overridesMatch = entry.entryName.match(/^(?:client-)?overrides\/(.+)$/)
    if (!overridesMatch) continue
    const relativePath = overridesMatch[1] as string
    const destPath = resolveWithinBase(gameDir, relativePath)
    await fs.mkdir(join(destPath, '..'), { recursive: true })
    await fs.writeFile(destPath, entry.getData())
  }
}

/** Imports a Modrinth .mrpack file as a brand-new Java profile with its mods and overrides. */
export async function importMrpackFile(zipPath: string): Promise<Profile> {
  const zip = new AdmZip(zipPath)
  const indexEntry = zip.getEntry('modrinth.index.json')
  if (!indexEntry) {
    throw new Error('Diese Datei ist kein gültiges .mrpack-Modpack (modrinth.index.json fehlt)')
  }
  const index = JSON.parse(indexEntry.getData().toString('utf-8')) as MrpackIndex
  const { loader, loaderVersion } = detectLoaderFromDependencies(index.dependencies)
  const minecraftVersion = index.dependencies.minecraft
  if (!minecraftVersion) {
    throw new Error('Modpack enthält keine Minecraft-Versionsangabe')
  }

  const now = new Date().toISOString()
  const profileId = randomUUID()
  const gameDir = paths.gameDirFor(profileId)
  const profile = await profileStore.addRaw({
    id: profileId,
    name: index.name || 'Importiertes Modpack',
    edition: 'java',
    minecraftVersion,
    loader,
    loaderVersion,
    ramMb: 4096,
    jvmArgs: '',
    javaPath: null,
    gameDir,
    icon: 'modpack-import',
    createdAt: now,
    updatedAt: now,
    lastPlayedAt: null,
    totalPlaytimeSeconds: 0
  })
  await fs.mkdir(gameDir, { recursive: true })

  await extractOverrides(zip, gameDir)

  const installedMods: InstalledMod[] = []
  for (const file of index.files) {
    if (file.env?.client === 'unsupported') continue
    const destPath = resolveWithinBase(gameDir, file.path)
    const url = file.downloads[0]
    if (!url) continue
    await downloadFile({ url, destPath, expectedSha1: file.hashes.sha1, expectedSize: file.fileSize })
    if (file.path.startsWith('mods/')) {
      installedMods.push({
        id: randomUUID(),
        platform: 'modrinth',
        projectId: null,
        versionId: null,
        fileName: file.path.replace('mods/', ''),
        sha1: file.hashes.sha1,
        name: file.path.replace('mods/', '').replace(/\.jar$/, ''),
        versionNumber: null,
        enabled: true,
        installedAt: now
      })
    }
  }
  if (installedMods.length > 0) {
    await lockfileStore.update(profile.id, (lockfile) => ({ ...lockfile, mods: installedMods }))
  }

  return profile
}

interface CurseForgeManifest {
  name: string
  minecraft: { version: string; modLoaders: Array<{ id: string; primary: boolean }> }
  files: Array<{ projectID: number; fileID: number; required: boolean }>
}

interface CurseForgeFileResponse {
  data: { downloadUrl: string | null; fileName: string; hashes: Array<{ algo: number; value: string }> }
}

/** Imports a CurseForge modpack .zip export as a new Java profile. Requires a CurseForge API key. */
export async function importCurseForgeModpackZip(zipPath: string): Promise<Profile> {
  const zip = new AdmZip(zipPath)
  const manifestEntry = zip.getEntry('manifest.json')
  if (!manifestEntry) {
    throw new Error('Diese Datei ist kein gültiges CurseForge-Modpack (manifest.json fehlt)')
  }
  const manifest = JSON.parse(manifestEntry.getData().toString('utf-8')) as CurseForgeManifest
  const primaryLoader = manifest.minecraft.modLoaders.find((l) => l.primary) ?? manifest.minecraft.modLoaders[0]
  const [loaderName, loaderVersion] = (primaryLoader?.id ?? 'forge-0').split('-')
  const loader = (['fabric', 'forge', 'neoforge', 'quilt'].includes(loaderName ?? '') ? loaderName : 'forge') as JavaLoader

  const apiKey = await getCurseForgeApiKey()
  if (!apiKey) {
    throw new Error(
      'Zum Importieren von CurseForge-Modpacks wird ein CurseForge-API-Schlüssel benötigt. Bitte in den Einstellungen hinterlegen.'
    )
  }

  const profileId = randomUUID()
  const gameDir = paths.gameDirFor(profileId)
  const now = new Date().toISOString()
  const profile = await profileStore.addRaw({
    id: profileId,
    name: manifest.name || 'Importiertes CurseForge-Modpack',
    edition: 'java',
    minecraftVersion: manifest.minecraft.version,
    loader,
    loaderVersion: loaderVersion ?? null,
    ramMb: 4096,
    jvmArgs: '',
    javaPath: null,
    gameDir,
    icon: 'modpack-import',
    createdAt: now,
    updatedAt: now,
    lastPlayedAt: null,
    totalPlaytimeSeconds: 0
  })
  await fs.mkdir(gameDir, { recursive: true })
  await extractOverrides(zip, gameDir)

  const modsDir = join(gameDir, 'mods')
  await fs.mkdir(modsDir, { recursive: true })
  const installedMods: InstalledMod[] = []
  for (const file of manifest.files) {
    try {
      const details = await fetchJson<CurseForgeFileResponse>(
        `${CURSEFORGE_API_BASE}/mods/${file.projectID}/files/${file.fileID}`,
        { headers: { 'x-api-key': apiKey } }
      )
      if (!details.data.downloadUrl) continue
      const sha1 = details.data.hashes.find((h) => h.algo === 1)?.value ?? null
      const destPath = join(modsDir, details.data.fileName)
      await downloadFile({ url: details.data.downloadUrl, destPath, expectedSha1: sha1 })
      installedMods.push({
        id: randomUUID(),
        platform: 'curseforge',
        projectId: String(file.projectID),
        versionId: String(file.fileID),
        fileName: details.data.fileName,
        sha1,
        name: details.data.fileName.replace(/\.jar$/, ''),
        versionNumber: null,
        enabled: true,
        installedAt: new Date().toISOString()
      })
    } catch {
      // A single unavailable/third-party-blocked mod shouldn't abort the whole modpack import.
    }
  }
  if (installedMods.length > 0) {
    await lockfileStore.update(profile.id, (lockfile) => ({ ...lockfile, mods: installedMods }))
  }

  return profile
}
