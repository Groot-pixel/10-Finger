import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import AdmZip from 'adm-zip'
import type { Profile } from '@shared/types'
import type { ProfileInput } from '@shared/schemas'
import { DEFAULT_PROFILE_ID } from '@shared/constants'
import { profileStore } from '../storage/profileStore'
import { paths } from '../storage/paths'

const MANIFEST_NAME = 'daybreak-profile.json'

export async function createProfile(input: ProfileInput): Promise<Profile> {
  if (input.edition === 'java') {
    const id = randomUUID()
    const now = new Date().toISOString()
    const profile: Profile = {
      id,
      name: input.name,
      edition: 'java',
      minecraftVersion: input.minecraftVersion,
      loader: input.loader,
      loaderVersion: input.loaderVersion,
      ramMb: input.ramMb,
      jvmArgs: input.jvmArgs,
      javaPath: input.javaPath,
      gameDir: paths.gameDirFor(id),
      icon: input.icon || 'default',
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: null,
      totalPlaytimeSeconds: 0
    }
    await fs.mkdir(profile.gameDir, { recursive: true })
    return profileStore.addRaw(profile)
  }
  const id = randomUUID()
  const now = new Date().toISOString()
  const profile: Profile = {
    id,
    name: input.name,
    edition: 'bedrock',
    channel: input.channel,
    icon: input.icon || 'default',
    createdAt: now,
    updatedAt: now,
    lastPlayedAt: null,
    totalPlaytimeSeconds: 0
  }
  return profileStore.addRaw(profile)
}

export async function duplicateProfile(id: string): Promise<Profile> {
  const source = await profileStore.get(id)
  if (!source) throw new Error(`Profil ${id} wurde nicht gefunden`)
  const newId = randomUUID()
  const now = new Date().toISOString()
  if (source.edition === 'java') {
    const copy: Profile = {
      ...source,
      id: newId,
      name: `${source.name} (Kopie)`,
      gameDir: paths.gameDirFor(newId),
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: null,
      totalPlaytimeSeconds: 0
    }
    await fs.mkdir(copy.gameDir, { recursive: true })
    try {
      await fs.cp(source.gameDir, copy.gameDir, { recursive: true })
    } catch {
      // Source game dir may not exist yet if the profile was never launched - fine.
    }
    return profileStore.addRaw(copy)
  }
  const copy: Profile = { ...source, id: newId, name: `${source.name} (Kopie)`, createdAt: now, updatedAt: now }
  return profileStore.addRaw(copy)
}

/** Exports a Java profile's full game directory plus its metadata into a single .zip the user picks a save path for. */
export async function exportProfileZip(id: string, destZipPath: string): Promise<string> {
  const profile = await profileStore.get(id)
  if (!profile) throw new Error(`Profil ${id} wurde nicht gefunden`)
  if (profile.edition !== 'java') {
    throw new Error('Nur Java-Profile können exportiert werden')
  }
  const zip = new AdmZip()
  zip.addFile(MANIFEST_NAME, Buffer.from(JSON.stringify({ ...profile, gameDir: undefined }), 'utf-8'))
  try {
    zip.addLocalFolder(profile.gameDir, 'gamedir')
  } catch {
    // Empty/never-launched profile - manifest alone is still a valid export.
  }
  zip.writeZip(destZipPath)
  return destZipPath
}

/** Imports a profile previously exported with exportProfileZip as a brand-new profile (fresh id). */
export async function importProfileZip(zipPath: string): Promise<Profile> {
  const zip = new AdmZip(zipPath)
  const manifestEntry = zip.getEntry(MANIFEST_NAME)
  if (!manifestEntry) {
    throw new Error('Diese Datei ist kein gültiger Daybreak-Client-Profil-Export')
  }
  const manifest = JSON.parse(manifestEntry.getData().toString('utf-8')) as Profile
  const newId = randomUUID()
  const now = new Date().toISOString()

  if (manifest.edition === 'java') {
    const gameDir = paths.gameDirFor(newId)
    await fs.mkdir(gameDir, { recursive: true })
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory || !entry.entryName.startsWith('gamedir/')) continue
      const relative = entry.entryName.slice('gamedir/'.length)
      if (!relative) continue
      const destPath = join(gameDir, relative)
      await fs.mkdir(join(destPath, '..'), { recursive: true })
      await fs.writeFile(destPath, entry.getData())
    }
    const profile: Profile = {
      ...manifest,
      id: newId,
      name: `${manifest.name} (importiert)`,
      gameDir,
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: null,
      totalPlaytimeSeconds: 0
    }
    return profileStore.addRaw(profile)
  }

  const profile: Profile = { ...manifest, id: newId, name: `${manifest.name} (importiert)`, createdAt: now, updatedAt: now }
  return profileStore.addRaw(profile)
}

function savesDirFor(profile: Profile): string {
  if (profile.edition !== 'java') throw new Error('Welten gibt es nur bei Java-Profilen')
  return join(profile.gameDir, 'saves')
}

export async function listWorlds(profileId: string): Promise<string[]> {
  const profile = await profileStore.get(profileId)
  if (!profile) throw new Error(`Profil ${profileId} wurde nicht gefunden`)
  try {
    const entries = await fs.readdir(savesDirFor(profile), { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
}

export async function backupWorld(profileId: string, worldName: string): Promise<string> {
  const profile = await profileStore.get(profileId)
  if (!profile) throw new Error(`Profil ${profileId} wurde nicht gefunden`)
  const worldDir = join(savesDirFor(profile), worldName)
  await fs.access(worldDir)
  const backupDir = join(app.getPath('userData'), 'backups')
  await fs.mkdir(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const destZipPath = join(backupDir, `${profileId}_${worldName}_${timestamp}.zip`)
  const zip = new AdmZip()
  zip.addLocalFolder(worldDir, worldName)
  zip.writeZip(destZipPath)
  return destZipPath
}

export { DEFAULT_PROFILE_ID }
