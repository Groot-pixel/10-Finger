import { QUILT_META_URL } from '@shared/constants'
import { fetchJson } from '../network/httpClient'
import { versionJsonSchema, type VersionJson } from '../minecraft/versionJsonTypes'

interface QuiltLoaderEntry {
  loader: { version: string }
}

export async function fetchQuiltLoaderVersions(gameVersion: string): Promise<QuiltLoaderEntry[]> {
  return fetchJson<QuiltLoaderEntry[]>(`${QUILT_META_URL}/versions/loader/${gameVersion}`)
}

export async function resolveLatestQuiltLoader(gameVersion: string): Promise<string> {
  const entries = await fetchQuiltLoaderVersions(gameVersion)
  const first = entries[0]
  if (!first) {
    throw new Error(`Keine Quilt-Loader-Version für Minecraft ${gameVersion} verfügbar`)
  }
  return first.loader.version
}

export async function fetchQuiltProfileJson(gameVersion: string, loaderVersion: string): Promise<VersionJson> {
  const raw = await fetchJson<unknown>(
    `${QUILT_META_URL}/versions/loader/${gameVersion}/${loaderVersion}/profile/json`
  )
  const result = versionJsonSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Quilt-Profil für ${gameVersion}/${loaderVersion} hat ein unerwartetes Format`)
  }
  return result.data
}
