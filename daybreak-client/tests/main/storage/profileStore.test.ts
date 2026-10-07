import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let userDataDir: string

vi.mock('electron', () => ({
  app: {
    getPath: (_name: string) => userDataDir
  }
}))

describe('profileStore', () => {
  beforeEach(async () => {
    userDataDir = await mkdtemp(join(tmpdir(), 'daybreak-profiles-'))
    vi.resetModules()
  })

  afterEach(async () => {
    await rm(userDataDir, { recursive: true, force: true })
  })

  it('creates the default DAYBREAK profile on first read', async () => {
    const { profileStore } = await import('@main/services/storage/profileStore')
    const profiles = await profileStore.list()
    expect(profiles).toHaveLength(1)
    expect(profiles[0]).toMatchObject({ id: 'daybreak-default', name: 'DAYBREAK', loader: 'fabric' })
  })

  it('persists a newly added profile across store instances (reload from disk)', async () => {
    const { profileStore } = await import('@main/services/storage/profileStore')
    const created = await profileStore.add({
      name: 'Testprofil',
      edition: 'java',
      minecraftVersion: '1.21',
      loader: 'vanilla',
      loaderVersion: null,
      ramMb: 2048,
      jvmArgs: '',
      javaPath: null,
      gameDir: join(userDataDir, 'profiles', 'test'),
      icon: 'default'
    })

    vi.resetModules()
    const { profileStore: reloadedStore } = await import('@main/services/storage/profileStore')
    const profiles = await reloadedStore.list()
    const found = profiles.find((p) => p.id === created.id)
    expect(found).toMatchObject({ name: 'Testprofil', minecraftVersion: '1.21' })
  })

  it('updates a profile in place and bumps updatedAt', async () => {
    const { profileStore } = await import('@main/services/storage/profileStore')
    const created = await profileStore.add({
      name: 'Original',
      edition: 'java',
      minecraftVersion: '1.20.1',
      loader: 'fabric',
      loaderVersion: null,
      ramMb: 4096,
      jvmArgs: '',
      javaPath: null,
      gameDir: join(userDataDir, 'profiles', 'orig'),
      icon: 'default'
    })

    const updated = await profileStore.update(created.id, { name: 'Umbenannt' })
    expect(updated.name).toBe('Umbenannt')
    expect(updated.id).toBe(created.id)
  })

  it('refuses to delete the default DAYBREAK profile', async () => {
    const { profileStore } = await import('@main/services/storage/profileStore')
    await expect(profileStore.remove('daybreak-default')).rejects.toThrow(/DAYBREAK/)
  })

  it('removes a non-default profile', async () => {
    const { profileStore } = await import('@main/services/storage/profileStore')
    const created = await profileStore.add({
      name: 'Löschbar',
      edition: 'java',
      minecraftVersion: '1.20.1',
      loader: 'vanilla',
      loaderVersion: null,
      ramMb: 4096,
      jvmArgs: '',
      javaPath: null,
      gameDir: join(userDataDir, 'profiles', 'del'),
      icon: 'default'
    })
    await profileStore.remove(created.id)
    const profiles = await profileStore.list()
    expect(profiles.find((p) => p.id === created.id)).toBeUndefined()
  })

  it('records playtime cumulatively across sessions', async () => {
    const { profileStore } = await import('@main/services/storage/profileStore')
    await profileStore.recordPlaySession('daybreak-default', 100)
    await profileStore.recordPlaySession('daybreak-default', 50)
    const profile = await profileStore.get('daybreak-default')
    expect(profile?.totalPlaytimeSeconds).toBe(150)
  })
})
