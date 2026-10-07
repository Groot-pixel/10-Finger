import { create } from 'zustand'
import type { AppSettings, MinecraftAccountProfile, Profile } from '@shared/types'
import { DEFAULT_PROFILE_ID } from '@shared/constants'

interface AppState {
  settings: AppSettings | null
  accounts: MinecraftAccountProfile[]
  profiles: Profile[]
  activeProfileId: string
  loading: boolean
  error: string | null
  setActiveProfileId: (id: string) => void
  refreshSettings: () => Promise<void>
  refreshAccounts: () => Promise<void>
  refreshProfiles: () => Promise<void>
  refreshAll: () => Promise<void>
  setError: (message: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: null,
  accounts: [],
  profiles: [],
  activeProfileId: DEFAULT_PROFILE_ID,
  loading: true,
  error: null,

  setActiveProfileId: (id) => set({ activeProfileId: id }),

  refreshSettings: async () => {
    const settings = await window.daybreak.settings.get()
    set({ settings })
  },

  refreshAccounts: async () => {
    const accounts = await window.daybreak.accounts.list()
    set({ accounts })
  },

  refreshProfiles: async () => {
    const profiles = await window.daybreak.profiles.list()
    const current = get().activeProfileId
    const stillExists = profiles.some((p) => p.id === current)
    set({ profiles, activeProfileId: stillExists ? current : profiles[0]?.id ?? DEFAULT_PROFILE_ID })
  },

  refreshAll: async () => {
    set({ loading: true, error: null })
    try {
      await Promise.all([get().refreshSettings(), get().refreshAccounts(), get().refreshProfiles()])
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      set({ loading: false })
    }
  },

  setError: (message) => set({ error: message })
}))
