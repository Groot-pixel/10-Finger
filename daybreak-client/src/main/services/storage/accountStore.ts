import { accountsFileSchema } from '@shared/schemas'
import type { MinecraftAccountProfile } from '@shared/types'
import { JsonStore } from './jsonStore'
import { paths } from './paths'

interface AccountsFile {
  accounts: MinecraftAccountProfile[]
}

function defaultAccountsFile(): AccountsFile {
  return { accounts: [] }
}

const store = new JsonStore<AccountsFile>(paths.accountsFile(), accountsFileSchema, defaultAccountsFile)

export const accountStore = {
  async list(): Promise<MinecraftAccountProfile[]> {
    return (await store.read()).accounts
  },
  async getActive(): Promise<MinecraftAccountProfile | null> {
    const accounts = (await store.read()).accounts
    return accounts.find((a) => a.isActive) ?? null
  },
  async upsert(account: MinecraftAccountProfile): Promise<MinecraftAccountProfile[]> {
    const result = await store.update((file) => {
      const exists = file.accounts.some((a) => a.id === account.id)
      const accounts = exists
        ? file.accounts.map((a) => (a.id === account.id ? account : a))
        : [...file.accounts, account]
      return { accounts }
    })
    return result.accounts
  },
  async setActive(accountId: string): Promise<MinecraftAccountProfile[]> {
    const result = await store.update((file) => ({
      accounts: file.accounts.map((a) => ({ ...a, isActive: a.id === accountId }))
    }))
    return result.accounts
  },
  async remove(accountId: string): Promise<MinecraftAccountProfile[]> {
    const result = await store.update((file) => {
      const remaining = file.accounts.filter((a) => a.id !== accountId)
      const hadActive = file.accounts.find((a) => a.id === accountId)?.isActive
      const first = remaining[0]
      if (hadActive && first && !remaining.some((a) => a.isActive)) {
        remaining[0] = { ...first, isActive: true }
      }
      return { accounts: remaining }
    })
    return result.accounts
  }
}
