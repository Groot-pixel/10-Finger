import { join } from 'node:path'
import { MOJANG_RESOURCES_BASE_URL } from '@shared/constants'
import { fetchJson } from '../network/httpClient'
import { paths } from '../storage/paths'
import type { DownloadTask } from '../network/downloader'
import type { VersionJson } from './versionJsonTypes'

interface AssetIndex {
  objects: Record<string, { hash: string; size: number }>
}

export async function fetchAssetIndex(versionJson: VersionJson): Promise<AssetIndex> {
  if (!versionJson.assetIndex) {
    throw new Error(`Version ${versionJson.id} enthält keinen Asset-Index`)
  }
  return fetchJson<AssetIndex>(versionJson.assetIndex.url)
}

/** Maps every entry in the asset index to its content-addressed download task under objects/xx/hash. */
export function resolveAssetDownloadTasks(assetIndex: AssetIndex): DownloadTask[] {
  const tasks: DownloadTask[] = []
  for (const object of Object.values(assetIndex.objects)) {
    const prefix = object.hash.slice(0, 2)
    tasks.push({
      url: `${MOJANG_RESOURCES_BASE_URL}/${prefix}/${object.hash}`,
      destPath: join(paths.assetsCacheDir(), 'objects', prefix, object.hash),
      expectedSha1: object.hash,
      expectedSize: object.size
    })
  }
  return tasks
}

export function assetsRootDir(): string {
  return paths.assetsCacheDir()
}
