import { MODRINTH_API_BASE, buildUserAgent } from '@shared/constants'
import type { ModSearchResult, ModVersionOption, ModDependencyRef } from '@shared/types'
import type { ModSearchQuery } from '@shared/schemas'
import { fetchJson } from '../network/httpClient'

function userAgentHeaders(appVersion: string): Record<string, string> {
  return { 'User-Agent': buildUserAgent(appVersion) }
}

interface ModrinthSearchHit {
  project_id: string
  slug: string
  title: string
  description: string
  icon_url: string | null
  downloads: number
  categories: string[]
  author: string
}

interface ModrinthSearchResponse {
  hits: ModrinthSearchHit[]
}

const SORT_INDEX: Record<ModSearchQuery['sortBy'], string> = {
  relevance: 'relevance',
  downloads: 'downloads',
  newest: 'newest',
  updated: 'updated'
}

export async function searchModrinth(query: ModSearchQuery, appVersion: string): Promise<ModSearchResult[]> {
  const facets: string[][] = [['project_type:mod']]
  if (query.minecraftVersion) facets.push([`versions:${query.minecraftVersion}`])
  if (query.loader) facets.push([`categories:${query.loader}`])
  if (query.category) facets.push([`categories:${query.category}`])

  const params = new URLSearchParams({
    query: query.query,
    index: SORT_INDEX[query.sortBy],
    offset: String(query.offset),
    limit: String(query.limit),
    facets: JSON.stringify(facets)
  })

  const data = await fetchJson<ModrinthSearchResponse>(`${MODRINTH_API_BASE}/search?${params.toString()}`, {
    headers: userAgentHeaders(appVersion)
  })

  return data.hits.map((hit) => ({
    platform: 'modrinth' as const,
    projectId: hit.project_id,
    slug: hit.slug,
    name: hit.title,
    summary: hit.description,
    iconUrl: hit.icon_url,
    downloads: hit.downloads,
    categories: hit.categories,
    author: hit.author
  }))
}

interface ModrinthVersion {
  id: string
  version_number: string
  game_versions: string[]
  loaders: string[]
  dependencies: Array<{
    project_id: string | null
    version_id: string | null
    dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
  }>
  files: Array<{ url: string; filename: string; primary: boolean; hashes: { sha1: string } }>
}

export async function listModrinthVersions(
  projectId: string,
  gameVersion: string,
  loader: string,
  appVersion: string
): Promise<ModVersionOption[]> {
  const params = new URLSearchParams({
    game_versions: JSON.stringify([gameVersion]),
    loaders: JSON.stringify([loader])
  })
  const versions = await fetchJson<ModrinthVersion[]>(
    `${MODRINTH_API_BASE}/project/${projectId}/version?${params.toString()}`,
    { headers: userAgentHeaders(appVersion) }
  )

  return versions.map((version) => {
    const file = version.files.find((f) => f.primary) ?? version.files[0]
    const dependencies: ModDependencyRef[] = version.dependencies
      .filter((d) => d.project_id !== null)
      .map((d) => ({
        platform: 'modrinth' as const,
        projectId: d.project_id,
        versionId: d.version_id,
        dependencyType: d.dependency_type
      }))
    return {
      platform: 'modrinth' as const,
      projectId,
      versionId: version.id,
      versionNumber: version.version_number,
      fileName: file?.filename ?? `${projectId}-${version.id}.jar`,
      downloadUrl: file?.url ?? null,
      sha1: file?.hashes.sha1 ?? null,
      gameVersions: version.game_versions,
      loaders: version.loaders,
      dependencies,
      distributionAllowed: true,
      projectUrl: `https://modrinth.com/mod/${projectId}`
    }
  })
}
