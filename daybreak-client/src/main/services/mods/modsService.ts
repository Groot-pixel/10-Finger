import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { basename, join } from 'node:path'
import type {
  InstalledMod,
  ModLockfile,
  ModSearchResult,
  ModVersionOption,
  Profile
} from '@shared/types'
import type { ModSearchQuery } from '@shared/schemas'
import { downloadFile, sha1File } from '../network/downloader'
import { profileStore } from '../storage/profileStore'
import { lockfileStore } from '../storage/lockfileStore'
import { settingsStore } from '../storage/settingsStore'
import { secretVault } from '../storage/secretVault'
import { searchModrinth, listModrinthVersions } from './modrinthClient'
import { searchCurseForge, listCurseForgeVersions } from './curseforgeClient'
import { resolveInstallOrder, findIncompatibilities, nodeKey, type DependencyNode } from './dependencyResolver'

const CURSEFORGE_KEY_SECRET = 'curseforge:apiKey'

export async function getCurseForgeApiKey(): Promise<string | null> {
  const envKey = process.env.CURSEFORGE_API_KEY?.trim()
  if (envKey) return envKey
  try {
    return await secretVault.get(CURSEFORGE_KEY_SECRET)
  } catch {
    return null
  }
}

export async function setCurseForgeApiKey(apiKey: string | null): Promise<void> {
  if (apiKey === null) {
    await secretVault.delete(CURSEFORGE_KEY_SECRET)
  } else {
    await secretVault.set(CURSEFORGE_KEY_SECRET, apiKey)
  }
}

export async function isCurseForgeEnabled(): Promise<boolean> {
  return (await getCurseForgeApiKey()) !== null
}

function requireJavaProfile(profile: Profile): Profile & { edition: 'java' } {
  if (profile.edition !== 'java') {
    throw new Error('Mods werden nur für Java-Profile unterstützt')
  }
  return profile
}

async function getProfileOrThrow(profileId: string): Promise<Profile> {
  const profile = await profileStore.get(profileId)
  if (!profile) throw new Error(`Profil ${profileId} wurde nicht gefunden`)
  return profile
}

export async function search(query: ModSearchQuery, appVersion: string): Promise<ModSearchResult[]> {
  if (query.platform === 'modrinth') {
    return searchModrinth(query, appVersion)
  }
  const apiKey = await getCurseForgeApiKey()
  if (!apiKey) {
    throw new Error(
      'Für CurseForge ist kein API-Schlüssel hinterlegt. Trage ihn in den Einstellungen ein oder setze die Umgebungsvariable CURSEFORGE_API_KEY.'
    )
  }
  return searchCurseForge(query, apiKey)
}

export async function listVersions(
  platform: 'modrinth' | 'curseforge',
  projectId: string,
  profileId: string,
  appVersion: string
): Promise<ModVersionOption[]> {
  const profile = requireJavaProfile(await getProfileOrThrow(profileId))
  if (profile.edition !== 'java') throw new Error('unreachable')
  const minecraftVersion =
    profile.minecraftVersion === 'latest-release' || profile.minecraftVersion === 'latest-snapshot'
      ? profile.minecraftVersion
      : profile.minecraftVersion
  if (platform === 'modrinth') {
    return listModrinthVersions(projectId, minecraftVersion, profile.loader, appVersion)
  }
  const apiKey = await getCurseForgeApiKey()
  if (!apiKey) throw new Error('Für CurseForge ist kein API-Schlüssel hinterlegt.')
  return listCurseForgeVersions(projectId, minecraftVersion, profile.loader, apiKey)
}

async function fetchVersionDetails(
  platform: 'modrinth' | 'curseforge',
  projectId: string,
  versionId: string,
  profile: Profile,
  appVersion: string
): Promise<ModVersionOption> {
  const versions = await listVersions(platform, projectId, profile.id, appVersion)
  const match = versions.find((v) => v.versionId === versionId)
  if (!match) {
    throw new Error(`Mod-Version ${versionId} wurde nicht gefunden oder ist für dieses Profil nicht kompatibel`)
  }
  return match
}

function modsDir(profile: Profile): string {
  if (profile.edition !== 'java') throw new Error('Mods werden nur für Java-Profile unterstützt')
  return join(profile.gameDir, 'mods')
}

async function downloadModVersion(version: ModVersionOption, destDir: string): Promise<InstalledMod> {
  if (!version.distributionAllowed || !version.downloadUrl) {
    throw new Error(
      `Der Autor dieser Mod erlaubt keinen automatischen Download über die API. Öffne die Mod-Seite (${version.projectUrl}) und installiere die Datei manuell, anschließend über "Manuell hinzufügen" einbinden.`
    )
  }
  const destPath = join(destDir, version.fileName)
  await downloadFile({ url: version.downloadUrl, destPath, expectedSha1: version.sha1 })
  return {
    id: randomUUID(),
    platform: version.platform,
    projectId: version.projectId,
    versionId: version.versionId,
    fileName: version.fileName,
    sha1: version.sha1,
    name: version.fileName.replace(/\.jar$/, ''),
    versionNumber: version.versionNumber,
    enabled: true,
    installedAt: new Date().toISOString()
  }
}

/**
 * Installs a mod and every required/embedded dependency it declares, in dependency-first
 * order, warning (by throwing with a clear message) if the target is marked incompatible
 * with something already installed.
 */
export async function installMod(
  profileId: string,
  platform: 'modrinth' | 'curseforge',
  projectId: string,
  versionId: string,
  appVersion: string
): Promise<ModLockfile> {
  const profile = requireJavaProfile(await getProfileOrThrow(profileId))
  const destDir = modsDir(profile)
  await fs.mkdir(destDir, { recursive: true })

  const targetVersion = await fetchVersionDetails(platform, projectId, versionId, profile, appVersion)
  const targetNode: DependencyNode = { key: nodeKey(platform, projectId), version: targetVersion }

  const existingLockfile = await lockfileStore.read(profileId)
  const conflicts = findIncompatibilities(targetNode, existingLockfile.mods)
  if (conflicts.length > 0) {
    throw new Error(
      `"${targetVersion.fileName}" ist nicht kompatibel mit bereits installierten Mods: ${conflicts.join(', ')}`
    )
  }

  const nodesByKey = new Map<string, DependencyNode>([[targetNode.key, targetNode]])
  const requiredRefs = targetVersion.dependencies.filter(
    (d) => (d.dependencyType === 'required' || d.dependencyType === 'embedded') && d.projectId
  )
  for (const ref of requiredRefs) {
    const key = nodeKey(ref.platform, ref.projectId as string)
    if (nodesByKey.has(key)) continue
    const alreadyInstalled = existingLockfile.mods.some(
      (m) => m.platform === ref.platform && m.projectId === ref.projectId
    )
    if (alreadyInstalled) continue
    const depVersions = await listVersions(ref.platform, ref.projectId as string, profileId, appVersion)
    const depVersion = ref.versionId
      ? depVersions.find((v) => v.versionId === ref.versionId) ?? depVersions[0]
      : depVersions[0]
    if (!depVersion) {
      throw new Error(`Benötigte Abhängigkeit ${key} konnte nicht für dieses Profil aufgelöst werden`)
    }
    nodesByKey.set(key, { key, version: depVersion })
  }

  const installOrder = resolveInstallOrder(targetNode, nodesByKey)
  const installedMods: InstalledMod[] = []
  for (const node of installOrder) {
    installedMods.push(await downloadModVersion(node.version, destDir))
  }

  return lockfileStore.update(profileId, (lockfile) => ({
    ...lockfile,
    mods: [...lockfile.mods.filter((m) => !installedMods.some((n) => n.fileName === m.fileName)), ...installedMods]
  }))
}

export async function listInstalled(profileId: string): Promise<InstalledMod[]> {
  return (await lockfileStore.read(profileId)).mods
}

export async function toggleMod(profileId: string, modId: string, enabled: boolean): Promise<ModLockfile> {
  const profile = requireJavaProfile(await getProfileOrThrow(profileId))
  const destDir = modsDir(profile)
  return lockfileStore.update(profileId, (lockfile) => {
    const mods = lockfile.mods.map((m) => {
      if (m.id !== modId) return m
      const currentName = m.enabled ? m.fileName : `${m.fileName}.disabled`
      const nextName = enabled ? m.fileName.replace(/\.disabled$/, '') : `${m.fileName}.disabled`
      void fs.rename(join(destDir, currentName), join(destDir, nextName)).catch(() => {})
      return { ...m, enabled }
    })
    return { ...lockfile, mods }
  })
}

export async function removeMod(profileId: string, modId: string): Promise<ModLockfile> {
  const profile = requireJavaProfile(await getProfileOrThrow(profileId))
  const destDir = modsDir(profile)
  const lockfile = await lockfileStore.read(profileId)
  const target = lockfile.mods.find((m) => m.id === modId)
  if (target) {
    const fileName = target.enabled ? target.fileName : `${target.fileName}.disabled`
    await fs.rm(join(destDir, fileName), { force: true })
  }
  return lockfileStore.update(profileId, (current) => ({
    ...current,
    mods: current.mods.filter((m) => m.id !== modId)
  }))
}

export async function addManualMod(profileId: string, sourceFilePath: string): Promise<ModLockfile> {
  const profile = requireJavaProfile(await getProfileOrThrow(profileId))
  const destDir = modsDir(profile)
  await fs.mkdir(destDir, { recursive: true })
  const fileName = basename(sourceFilePath)
  const destPath = join(destDir, fileName)
  await fs.copyFile(sourceFilePath, destPath)
  const sha1 = await sha1File(destPath)
  const mod: InstalledMod = {
    id: randomUUID(),
    platform: 'manual',
    projectId: null,
    versionId: null,
    fileName,
    sha1,
    name: fileName.replace(/\.jar$/, ''),
    versionNumber: null,
    enabled: true,
    installedAt: new Date().toISOString()
  }
  return lockfileStore.update(profileId, (lockfile) => ({ ...lockfile, mods: [...lockfile.mods, mod] }))
}

export async function checkForUpdates(profileId: string, appVersion: string): Promise<InstalledMod[]> {
  const profile = await getProfileOrThrow(profileId)
  const lockfile = await lockfileStore.read(profileId)
  const updatable: InstalledMod[] = []
  for (const mod of lockfile.mods) {
    if (mod.platform === 'manual' || !mod.projectId) continue
    try {
      const versions = await listVersions(mod.platform, mod.projectId, profile.id, appVersion)
      const latest = versions[0]
      if (latest && latest.versionId !== mod.versionId) {
        updatable.push(mod)
      }
    } catch {
      // Network hiccup or project gone - skip silently for this one mod, don't fail the whole check.
    }
  }
  return updatable
}

export async function updateAllMods(profileId: string, appVersion: string): Promise<ModLockfile> {
  const profile = requireJavaProfile(await getProfileOrThrow(profileId))
  const destDir = modsDir(profile)
  const outdated = await checkForUpdates(profileId, appVersion)
  for (const mod of outdated) {
    if (!mod.projectId) continue
    const versions = await listVersions(mod.platform as 'modrinth' | 'curseforge', mod.projectId, profileId, appVersion)
    const latest = versions[0]
    if (!latest) continue
    const fileName = mod.enabled ? mod.fileName : `${mod.fileName}.disabled`
    await fs.rm(join(destDir, fileName), { force: true })
    const installed = await downloadModVersion(latest, destDir)
    await lockfileStore.update(profileId, (lockfile) => ({
      ...lockfile,
      mods: lockfile.mods.map((m) => (m.id === mod.id ? { ...installed, id: mod.id, enabled: mod.enabled } : m))
    }))
  }
  return lockfileStore.read(profileId)
}
