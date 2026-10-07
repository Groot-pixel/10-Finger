import { modLockfileSchema } from '@shared/schemas'
import type { ModLockfile } from '@shared/types'
import { JsonStore } from './jsonStore'
import { paths } from './paths'

const cache = new Map<string, JsonStore<ModLockfile>>()

function storeFor(profileId: string): JsonStore<ModLockfile> {
  let store = cache.get(profileId)
  if (!store) {
    store = new JsonStore<ModLockfile>(paths.lockfileFor(profileId), modLockfileSchema, () => ({
      profileId,
      mods: [],
      updatedAt: new Date().toISOString()
    }))
    cache.set(profileId, store)
  }
  return store
}

export const lockfileStore = {
  async read(profileId: string): Promise<ModLockfile> {
    return storeFor(profileId).read()
  },
  async update(
    profileId: string,
    mutator: (lockfile: ModLockfile) => ModLockfile
  ): Promise<ModLockfile> {
    return storeFor(profileId).update((current) => {
      const next = mutator(current)
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }
}
