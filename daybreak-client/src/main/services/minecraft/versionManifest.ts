import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { MOJANG_VERSION_MANIFEST_URL } from '@shared/constants'
import { fetchJson } from '../network/httpClient'
import { paths } from '../storage/paths'
import {
  versionManifestSchema,
  versionJsonSchema,
  type VersionJson,
  type VersionManifest,
  type VersionManifestEntry,
  type Library
} from './versionJsonTypes'

export async function fetchVersionManifest(): Promise<VersionManifest> {
  const raw = await fetchJson<unknown>(MOJANG_VERSION_MANIFEST_URL)
  const result = versionManifestSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Versions-Manifest von Mojang hat ein unerwartetes Format: ${result.error.message}`)
  }
  return result.data
}

/** Resolves "latest-release" / "latest-snapshot" / an explicit id to a concrete manifest entry. */
export function resolveVersionId(manifest: VersionManifest, requested: string): VersionManifestEntry {
  const id =
    requested === 'latest-release'
      ? manifest.latest.release
      : requested === 'latest-snapshot'
        ? manifest.latest.snapshot
        : requested
  const entry = manifest.versions.find((v) => v.id === id)
  if (!entry) {
    throw new Error(`Minecraft-Version "${requested}" wurde im Versions-Manifest nicht gefunden`)
  }
  return entry
}

async function readCachedVersionJson(versionId: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(join(paths.versionsCacheDir(), `${versionId}.json`), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function writeCachedVersionJson(versionId: string, data: unknown): Promise<void> {
  await fs.mkdir(paths.versionsCacheDir(), { recursive: true })
  await fs.writeFile(join(paths.versionsCacheDir(), `${versionId}.json`), JSON.stringify(data), 'utf-8')
}

export async function fetchVersionJson(entry: VersionManifestEntry): Promise<VersionJson> {
  const cached = await readCachedVersionJson(entry.id)
  const raw = cached ?? (await fetchJson<unknown>(entry.url))
  if (!cached) await writeCachedVersionJson(entry.id, raw)
  const result = versionJsonSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Versionsdaten für ${entry.id} haben ein unerwartetes Format: ${result.error.message}`)
  }
  return result.data
}

export async function fetchVersionJsonById(manifest: VersionManifest, versionId: string): Promise<VersionJson> {
  const entry = manifest.versions.find((v) => v.id === versionId)
  if (entry) return fetchVersionJson(entry)
  // Loader "profile" JSONs that inheritsFrom a vanilla version still need that vanilla
  // version resolved even if it isn't the version the user picked directly.
  const resolved = resolveVersionId(manifest, versionId)
  return fetchVersionJson(resolved)
}

function mergeLibraries(child: Library[], parent: Library[]): Library[] {
  const byName = new Map<string, Library>()
  for (const lib of parent) byName.set(lib.name, lib)
  for (const lib of child) byName.set(lib.name, lib)
  return Array.from(byName.values())
}

/**
 * Merges a child version JSON (e.g. a Fabric/Quilt loader profile) with the vanilla version
 * JSON it declares via "inheritsFrom", following the same override semantics the official
 * launcher uses: the child's mainClass/arguments win, libraries are unioned by artifact name.
 */
export function mergeVersionJson(child: VersionJson, parent: VersionJson): VersionJson {
  return {
    ...parent,
    ...child,
    id: child.id,
    inheritsFrom: undefined,
    libraries: mergeLibraries(child.libraries ?? [], parent.libraries ?? []),
    arguments: {
      game: [...(parent.arguments?.game ?? []), ...(child.arguments?.game ?? [])],
      jvm: [...(parent.arguments?.jvm ?? []), ...(child.arguments?.jvm ?? [])]
    },
    assetIndex: child.assetIndex ?? parent.assetIndex,
    assets: child.assets ?? parent.assets,
    downloads: child.downloads ?? parent.downloads,
    javaVersion: child.javaVersion ?? parent.javaVersion,
    mainClass: child.mainClass ?? parent.mainClass,
    minecraftArguments: child.minecraftArguments ?? parent.minecraftArguments
  }
}

/** Resolves a version JSON fully, recursively merging every "inheritsFrom" ancestor. */
export async function resolveFullVersionJson(
  manifest: VersionManifest,
  versionJson: VersionJson
): Promise<VersionJson> {
  if (!versionJson.inheritsFrom) return versionJson
  const parent = await fetchVersionJsonById(manifest, versionJson.inheritsFrom)
  const resolvedParent = await resolveFullVersionJson(manifest, parent)
  return mergeVersionJson(versionJson, resolvedParent)
}
