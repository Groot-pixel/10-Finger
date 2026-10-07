import {
  CURSEFORGE_API_BASE,
  CURSEFORGE_MINECRAFT_GAME_ID,
  CURSEFORGE_MOD_CLASS_ID
} from '@shared/constants'
import type { ModDependencyRef, ModSearchResult, ModVersionOption } from '@shared/types'
import type { ModSearchQuery } from '@shared/schemas'
import { fetchJson } from '../network/httpClient'

function authHeaders(apiKey: string): Record<string, string> {
  return { 'x-api-key': apiKey, Accept: 'application/json' }
}

interface CurseForgeMod {
  id: number
  slug: string
  name: string
  summary: string
  logo: { thumbnailUrl: string } | null
  downloadCount: number
  categories: Array<{ name: string }>
  authors: Array<{ name: string }>
}

interface CurseForgeSearchResponse {
  data: CurseForgeMod[]
}

const SORT_FIELD: Record<ModSearchQuery['sortBy'], number> = {
  relevance: 2,
  downloads: 6,
  newest: 11,
  updated: 3
}

export async function searchCurseForge(query: ModSearchQuery, apiKey: string): Promise<ModSearchResult[]> {
  const params = new URLSearchParams({
    gameId: String(CURSEFORGE_MINECRAFT_GAME_ID),
    classId: String(CURSEFORGE_MOD_CLASS_ID),
    searchFilter: query.query,
    sortField: String(SORT_FIELD[query.sortBy]),
    sortOrder: 'desc',
    index: String(query.offset),
    pageSize: String(query.limit)
  })
  if (query.minecraftVersion) params.set('gameVersion', query.minecraftVersion)
  if (query.loader) params.set('modLoaderType', modLoaderTypeId(query.loader))

  const data = await fetchJson<CurseForgeSearchResponse>(`${CURSEFORGE_API_BASE}/mods/search?${params.toString()}`, {
    headers: authHeaders(apiKey)
  })

  return data.data.map((mod) => ({
    platform: 'curseforge' as const,
    projectId: String(mod.id),
    slug: mod.slug,
    name: mod.name,
    summary: mod.summary,
    iconUrl: mod.logo?.thumbnailUrl ?? null,
    downloads: mod.downloadCount,
    categories: mod.categories.map((c) => c.name),
    author: mod.authors[0]?.name ?? 'Unbekannt'
  }))
}

function modLoaderTypeId(loader: string): string {
  const map: Record<string, string> = { forge: '1', fabric: '4', quilt: '5', neoforge: '6', vanilla: '0' }
  return map[loader] ?? '0'
}

interface CurseForgeFile {
  id: number
  modId: number
  fileName: string
  displayName: string
  downloadUrl: string | null
  isAvailable: boolean
  gameVersions: string[]
  hashes: Array<{ algo: number; value: string }>
  dependencies: Array<{ modId: number; relationType: number }>
}

interface CurseForgeFilesResponse {
  data: CurseForgeFile[]
}

/** relationType 3 = RequiredDependency, 2 = OptionalDependency, 5 = Incompatible, 6 = Embedded (CurseForge API enum). */
const RELATION_TYPE_MAP: Record<number, ModDependencyRef['dependencyType']> = {
  2: 'optional',
  3: 'required',
  5: 'incompatible',
  6: 'embedded'
}

export async function listCurseForgeVersions(
  projectId: string,
  gameVersion: string,
  loader: string,
  apiKey: string
): Promise<ModVersionOption[]> {
  const params = new URLSearchParams({ gameVersion, modLoaderType: modLoaderTypeId(loader) })
  const data = await fetchJson<CurseForgeFilesResponse>(
    `${CURSEFORGE_API_BASE}/mods/${projectId}/files?${params.toString()}`,
    { headers: authHeaders(apiKey) }
  )

  return data.data.map((file) => {
    const sha1 = file.hashes.find((h) => h.algo === 1)?.value ?? null
    const dependencies: ModDependencyRef[] = file.dependencies
      .filter((d) => RELATION_TYPE_MAP[d.relationType])
      .map((d) => ({
        platform: 'curseforge' as const,
        projectId: String(d.modId),
        versionId: null,
        dependencyType: RELATION_TYPE_MAP[d.relationType] as ModDependencyRef['dependencyType']
      }))
    return {
      platform: 'curseforge' as const,
      projectId,
      versionId: String(file.id),
      versionNumber: file.displayName,
      fileName: file.fileName,
      // isAvailable is false when the mod author disabled third-party API distribution
      // (allowModDistribution=false) - we must not try to download it in that case.
      downloadUrl: file.isAvailable ? file.downloadUrl : null,
      sha1,
      gameVersions: file.gameVersions,
      loaders: [loader],
      dependencies,
      distributionAllowed: file.isAvailable && file.downloadUrl !== null,
      projectUrl: `https://www.curseforge.com/minecraft/mc-mods/${projectId}`
    }
  })
}
