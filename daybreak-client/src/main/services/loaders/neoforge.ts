import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { NEOFORGE_MAVEN_URL } from '@shared/constants'
import { fetchWithRetry } from '../network/httpClient'
import { downloadFile } from '../network/downloader'
import { spawnGameProcess } from '../minecraft/processLauncher'
import { versionJsonSchema, type VersionJson } from '../minecraft/versionJsonTypes'
import { paths } from '../storage/paths'

/** NeoForge publishes its catalog as plain Maven metadata rather than a JSON API. */
export async function listNeoForgeVersions(): Promise<string[]> {
  const response = await fetchWithRetry(`${NEOFORGE_MAVEN_URL}/net/neoforged/neoforge/maven-metadata.xml`)
  const xml = await response.text()
  const versions = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((m) => m[1] as string)
  if (versions.length === 0) {
    throw new Error('Konnte keine NeoForge-Versionen aus den Maven-Metadaten lesen')
  }
  return versions
}

/** NeoForge version strings look like "21.1.100" and already encode the targeted Minecraft minor/patch. */
export async function resolveNeoForgeVersion(minecraftVersion: string): Promise<string> {
  const match = minecraftVersion.match(/^1\.(\d+)(?:\.(\d+))?$/)
  if (!match) {
    throw new Error(`NeoForge unterstützt diese Minecraft-Version nicht: ${minecraftVersion}`)
  }
  const minor = match[1]
  const patch = match[2] ?? '0'
  const prefix = `${minor}.${patch}.`
  const versions = await listNeoForgeVersions()
  const matching = versions.filter((v) => v.startsWith(prefix)).toSorted().toReversed()
  const chosen = matching[0]
  if (!chosen) {
    throw new Error(`Keine NeoForge-Version für Minecraft ${minecraftVersion} gefunden`)
  }
  return chosen
}

export function neoForgeInstallerUrl(neoForgeVersion: string): string {
  return `${NEOFORGE_MAVEN_URL}/net/neoforged/neoforge/${neoForgeVersion}/neoforge-${neoForgeVersion}-installer.jar`
}

export async function installNeoForge(
  minecraftVersion: string,
  neoForgeVersion: string,
  gameDir: string,
  javaPath: string,
  onOutput: (line: string) => void
): Promise<VersionJson> {
  const installerPath = join(paths.versionsCacheDir(), `neoforge-${neoForgeVersion}-installer.jar`)
  await downloadFile({
    url: neoForgeInstallerUrl(neoForgeVersion),
    destPath: installerPath,
    expectedSha1: null
  })

  await new Promise<void>((resolve, reject) => {
    spawnGameProcess(
      `neoforge-installer-${neoForgeVersion}`,
      javaPath,
      ['-jar', installerPath, '--installClient', gameDir],
      gameDir,
      (_stream, line) => onOutput(line),
      (code) => {
        if (code === 0) resolve()
        else reject(new Error(`NeoForge-Installer wurde mit Code ${code} beendet`))
      }
    )
  })

  const versionId = `neoforge-${neoForgeVersion}`
  const profilePath = join(gameDir, 'versions', versionId, `${versionId}.json`)
  const raw = JSON.parse(await fs.readFile(profilePath, 'utf-8'))
  const result = versionJsonSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Von NeoForge installierte Profildatei ist ungültig: ${result.error.message}`)
  }
  return result.data
}
