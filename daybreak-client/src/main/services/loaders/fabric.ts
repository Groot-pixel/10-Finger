import { FABRIC_META_URL } from '@shared/constants'
import { fetchJson } from '../network/httpClient'
import { versionJsonSchema, type VersionJson } from '../minecraft/versionJsonTypes'

interface FabricLoaderEntry {
  loader: { version: string; stable: boolean }
}

/** Loader versions for a given Minecraft version, newest first (Fabric's API already sorts them). */
export async function fetchFabricLoaderVersions(gameVersion: string): Promise<FabricLoaderEntry[]> {
  return fetchJson<FabricLoaderEntry[]>(`${FABRIC_META_URL}/versions/loader/${gameVersion}`)
}

export async function resolveLatestStableFabricLoader(gameVersion: string): Promise<string> {
  const entries = await fetchFabricLoaderVersions(gameVersion)
  const stable = entries.find((e) => e.loader.stable) ?? entries[0]
  if (!stable) {
    throw new Error(`Keine Fabric-Loader-Version für Minecraft ${gameVersion} verfügbar`)
  }
  return stable.loader.version
}

/** The Fabric meta "profile/json" endpoint already returns a Mojang-shaped version JSON that inheritsFrom vanilla. */
export async function fetchFabricProfileJson(gameVersion: string, loaderVersion: string): Promise<VersionJson> {
  const raw = await fetchJson<unknown>(
    `${FABRIC_META_URL}/versions/loader/${gameVersion}/${loaderVersion}/profile/json`
  )
  const result = versionJsonSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Fabric-Profil für ${gameVersion}/${loaderVersion} hat ein unerwartetes Format`)
  }
  return result.data
}
