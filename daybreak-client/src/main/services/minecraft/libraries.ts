import { join } from 'node:path'
import { evaluateRules, type HostOs } from './ruleEvaluator'
import type { VersionJson } from './versionJsonTypes'
import { paths } from '../storage/paths'
import type { DownloadTask } from '../network/downloader'

function mavenNameToRelativePath(name: string): { path: string; fileName: string } {
  const [coordinatesPart, classifier] = name.split('@')
  const coordinates = coordinatesPart ?? name
  const parts = coordinates.split(':')
  const group = parts[0] ?? ''
  const artifact = parts[1] ?? ''
  const version = parts[2] ?? ''
  const fileClassifier = classifier ? `-${classifier}` : ''
  const fileName = `${artifact}-${version}${fileClassifier}.jar`
  const path = join(...group.split('.'), artifact, version, fileName)
  return { path, fileName }
}

export interface ResolvedLibraries {
  classpathPaths: string[]
  downloadTasks: DownloadTask[]
  nativesArchives: DownloadTask[]
}

/**
 * Walks the merged version JSON's library list, filters by OS rules, and produces both the
 * flat classpath (plain jars) and the separate native-archive downloads (platform-specific
 * .jar/.zip files that get extracted into the natives directory, never put on the classpath).
 */
export function resolveLibraries(
  versionJson: VersionJson,
  hostOs: HostOs,
  hostArch: string
): ResolvedLibraries {
  const classpathPaths: string[] = []
  const downloadTasks: DownloadTask[] = []
  const nativesArchives: DownloadTask[] = []
  const librariesDir = paths.librariesCacheDir()

  for (const lib of versionJson.libraries ?? []) {
    if (!evaluateRules(lib.rules, { os: hostOs, arch: hostArch, features: {} })) continue

    const artifact = lib.downloads?.artifact
    if (artifact) {
      const relativePath = artifact.path ?? mavenNameToRelativePath(lib.name).path
      const destPath = join(librariesDir, relativePath)
      classpathPaths.push(destPath)
      downloadTasks.push({
        url: artifact.url,
        destPath,
        expectedSha1: artifact.sha1 || null,
        expectedSize: artifact.size
      })
    } else if (!lib.downloads) {
      // Old-format / Forge-style library: no explicit downloads block, derive a Maven path.
      const { path: relativePath } = mavenNameToRelativePath(lib.name)
      const destPath = join(librariesDir, relativePath)
      const baseUrl = lib.url ?? 'https://libraries.minecraft.net/'
      classpathPaths.push(destPath)
      downloadTasks.push({
        url: `${baseUrl.replace(/\/?$/, '/')}${relativePath.replace(/\\/g, '/')}`,
        destPath,
        expectedSha1: null
      })
    }

    const nativeClassifierKey = lib.natives?.[hostOs]
    const nativeArtifact = nativeClassifierKey ? lib.downloads?.classifiers?.[nativeClassifierKey] : undefined
    if (nativeArtifact) {
      const relativePath = nativeArtifact.path ?? mavenNameToRelativePath(`${lib.name}@${nativeClassifierKey}`).path
      const destPath = join(librariesDir, relativePath)
      nativesArchives.push({
        url: nativeArtifact.url,
        destPath,
        expectedSha1: nativeArtifact.sha1 || null,
        expectedSize: nativeArtifact.size
      })
    }
  }

  return { classpathPaths, downloadTasks, nativesArchives }
}

export function clientJarDownloadTask(versionJson: VersionJson, destPath: string): DownloadTask | null {
  const client = versionJson.downloads?.client
  if (!client) return null
  return { url: client.url, destPath, expectedSha1: client.sha1, expectedSize: client.size }
}
