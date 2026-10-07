import { randomUUID } from 'node:crypto'
import { profilesFileSchema } from '@shared/schemas'
import type { Profile } from '@shared/types'
import { DEFAULT_PROFILE_ID, DEFAULT_PROFILE_NAME } from '@shared/constants'
import { JsonStore } from './jsonStore'
import { paths } from './paths'

interface ProfilesFile {
  profiles: Profile[]
}

function defaultProfilesFile(): ProfilesFile {
  const now = new Date().toISOString()
  return {
    profiles: [
      {
        id: DEFAULT_PROFILE_ID,
        name: DEFAULT_PROFILE_NAME,
        edition: 'java',
        minecraftVersion: 'latest-release',
        loader: 'fabric',
        loaderVersion: null,
        ramMb: 4096,
        jvmArgs: '',
        javaPath: null,
        gameDir: paths.gameDirFor(DEFAULT_PROFILE_ID),
        icon: 'daybreak-default',
        createdAt: now,
        updatedAt: now,
        lastPlayedAt: null,
        totalPlaytimeSeconds: 0
      }
    ]
  }
}

const store = new JsonStore<ProfilesFile>(paths.profilesFile(), profilesFileSchema, defaultProfilesFile)

export const profileStore = {
  async list(): Promise<Profile[]> {
    const file = await store.read()
    return file.profiles
  },
  async get(id: string): Promise<Profile | null> {
    const file = await store.read()
    return file.profiles.find((p) => p.id === id) ?? null
  },
  async add(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'lastPlayedAt' | 'totalPlaytimeSeconds'>): Promise<Profile> {
    const now = new Date().toISOString()
    const full = {
      ...profile,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: null,
      totalPlaytimeSeconds: 0
    } as Profile
    await store.update((file) => ({ profiles: [...file.profiles, full] }))
    return full
  },
  async update(id: string, patch: Partial<Profile>): Promise<Profile> {
    let updated: Profile | null = null
    await store.update((file) => {
      const profiles = file.profiles.map((p) => {
        if (p.id !== id) return p
        const merged = { ...p, ...patch, id: p.id, updatedAt: new Date().toISOString() } as Profile
        updated = merged
        return merged
      })
      return { profiles }
    })
    if (!updated) {
      throw new Error(`Profil ${id} wurde nicht gefunden`)
    }
    return updated
  },
  async remove(id: string): Promise<void> {
    if (id === DEFAULT_PROFILE_ID) {
      throw new Error('Das Standardprofil DAYBREAK kann nicht gelöscht werden')
    }
    await store.update((file) => ({ profiles: file.profiles.filter((p) => p.id !== id) }))
  },
  async addRaw(profile: Profile): Promise<Profile> {
    await store.update((file) => ({ profiles: [...file.profiles, profile] }))
    return profile
  },
  async recordPlaySession(id: string, secondsPlayed: number): Promise<void> {
    await store.update((file) => ({
      profiles: file.profiles.map((p) =>
        p.id === id
          ? {
              ...p,
              lastPlayedAt: new Date().toISOString(),
              totalPlaytimeSeconds: p.totalPlaytimeSeconds + Math.max(0, secondsPlayed)
            }
          : p
      )
    }))
  }
}
