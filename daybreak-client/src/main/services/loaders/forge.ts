import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { FORGE_MAVEN_URL, FORGE_PROMOTIONS_URL } from '@shared/constants'
import { fetchJson } from '../network/httpClient'
import { downloadFile } from '../network/downloader'
import { spawnGameProcess } from '../minecraft/processLauncher'
import { versionJsonSchema, type VersionJson } from '../minecraft/versionJsonTypes'
import { paths } from '../storage/paths'

interface ForgePromotions {
  promos: Record<string, string>
}

/** Resolves the recommended (falling back to latest) Forge build for a Minecraft version. */
export async function resolveForgeVersion(minecraftVersion: string): Promise<string> {
  const promotions = await fetchJson<ForgePromotions>(FORGE_PROMOTIONS_URL)
  const recommended = promotions.promos[`${minecraftVersion}-recommended`]
  const latest = promotions.promos[`${minecraftVersion}-latest`]
  const version = recommended ?? latest
  if (!version) {
    throw new Error(`Keine Forge-Version für Minecraft ${minecraftVersion} gefunden`)
  }
  return version
}

export function forgeInstallerUrl(minecraftVersion: string, forgeVersion: string): string {
  const full = `${minecraftVersion}-${forgeVersion}`
  return `${FORGE_MAVEN_URL}/net/minecraftforge/forge/${full}/forge-${full}-installer.jar`
}

/**
 * Downloads the official Forge installer and runs it headlessly against the profile's game
 * directory (the same `--installClient <dir>` flow third-party launchers like MultiMC/ATLauncher
 * use), then reads back the version profile JSON the installer wrote to versions/<id>/<id>.json.
 */
export async function installForge(
  minecraftVersion: string,
  forgeVersion: string,
  gameDir: string,
  javaPath: string,
  onOutput: (line: string) => void
): Promise<VersionJson> {
  const installerPath = join(paths.versionsCacheDir(), `forge-${minecraftVersion}-${forgeVersion}-installer.jar`)
  await downloadFile({
    url: forgeInstallerUrl(minecraftVersion, forgeVersion),
    destPath: installerPath,
    expectedSha1: null
  })

  await new Promise<void>((resolve, reject) => {
    spawnGameProcess(
      `forge-installer-${minecraftVersion}-${forgeVersion}`,
      javaPath,
      ['-jar', installerPath, '--installClient', gameDir],
      gameDir,
      (_stream, line) => onOutput(line),
      (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Forge-Installer wurde mit Code ${code} beendet`))
      }
    )
  })

  const versionId = `${minecraftVersion}-forge-${forgeVersion}`
  const profilePath = join(gameDir, 'versions', versionId, `${versionId}.json`)
  const raw = JSON.parse(await fs.readFile(profilePath, 'utf-8'))
  const result = versionJsonSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Von Forge installierte Profildatei ist ungültig: ${result.error.message}`)
  }
  return result.data
}
