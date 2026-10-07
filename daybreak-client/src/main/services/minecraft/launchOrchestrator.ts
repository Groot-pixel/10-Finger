import { join } from 'node:path'
import { promises as fs } from 'node:fs'
import type { JavaProfile } from '@shared/types'
import { MAX_PARALLEL_DOWNLOADS } from '@shared/constants'
import { runWithConcurrencyLimit } from '../network/concurrencyPool'
import { downloadFile, type DownloadTask } from '../network/downloader'
import { paths } from '../storage/paths'
import { profileStore } from '../storage/profileStore'
import {
  fetchVersionManifest,
  fetchVersionJson,
  resolveFullVersionJson,
  resolveVersionId
} from './versionManifest'
import { resolveLibraries, clientJarDownloadTask } from './libraries'
import { fetchAssetIndex, resolveAssetDownloadTasks, assetsRootDir } from './assets'
import { extractNatives } from './natives'
import { resolveJava } from './javaLocator'
import { buildLaunchArguments, type LaunchAuth } from './argumentBuilder'
import { currentHostOs } from './ruleEvaluator'
import { spawnGameProcess, stopProfile, isProfileRunning } from './processLauncher'
import { analyzeCrash } from './crashAnalyzer'
import { launchEvents } from './launchEvents'
import { resolveLatestStableFabricLoader, fetchFabricProfileJson } from '../loaders/fabric'
import { resolveLatestQuiltLoader, fetchQuiltProfileJson } from '../loaders/quilt'
import { resolveForgeVersion, installForge } from '../loaders/forge'
import { resolveNeoForgeVersion, installNeoForge } from '../loaders/neoforge'
import type { VersionJson } from './versionJsonTypes'
import type { VersionManifest } from './versionJsonTypes'

const CONSOLE_HISTORY_LIMIT = 500

function requiredJavaMajorVersion(versionJson: VersionJson, minecraftVersion: string): number {
  if (versionJson.javaVersion) return versionJson.javaVersion.majorVersion
  const match = minecraftVersion.match(/^1\.(\d+)/)
  const minor = match ? Number(match[1]) : 0
  if (minor >= 20) return 21
  if (minor >= 17) return 17
  return 8
}

async function resolveLoaderVersionJson(
  profile: JavaProfile,
  manifest: VersionManifest,
  minecraftVersion: string,
  javaPathForInstallers: string,
  onOutput: (line: string) => void
): Promise<VersionJson> {
  const vanillaEntry = resolveVersionId(manifest, minecraftVersion)
  const vanillaJson = await fetchVersionJson(vanillaEntry)

  if (profile.loader === 'vanilla') {
    return resolveFullVersionJson(manifest, vanillaJson)
  }

  if (profile.loader === 'fabric') {
    const loaderVersion = profile.loaderVersion ?? (await resolveLatestStableFabricLoader(minecraftVersion))
    const profileJson = await fetchFabricProfileJson(minecraftVersion, loaderVersion)
    return resolveFullVersionJson(manifest, profileJson)
  }

  if (profile.loader === 'quilt') {
    const loaderVersion = profile.loaderVersion ?? (await resolveLatestQuiltLoader(minecraftVersion))
    const profileJson = await fetchQuiltProfileJson(minecraftVersion, loaderVersion)
    return resolveFullVersionJson(manifest, profileJson)
  }

  if (profile.loader === 'forge') {
    const forgeVersion = profile.loaderVersion ?? (await resolveForgeVersion(minecraftVersion))
    const installed = await installForge(minecraftVersion, forgeVersion, profile.gameDir, javaPathForInstallers, onOutput)
    return resolveFullVersionJson(manifest, installed)
  }

  const neoForgeVersion = profile.loaderVersion ?? (await resolveNeoForgeVersion(minecraftVersion))
  const installed = await installNeoForge(minecraftVersion, neoForgeVersion, profile.gameDir, javaPathForInstallers, onOutput)
  return resolveFullVersionJson(manifest, installed)
}

export async function launchJavaProfile(profile: JavaProfile, auth: LaunchAuth, javaOverride: string | null, appVersion: string): Promise<void> {
  if (isProfileRunning(profile.id)) {
    throw new Error('Dieses Profil läuft bereits')
  }

  const emitProgress = (phase: Parameters<typeof launchEvents.emitProgress>[0]['phase'], message: string): void =>
    launchEvents.emitProgress({ profileId: profile.id, phase, message, progress: null, total: null })

  await fs.mkdir(profile.gameDir, { recursive: true })

  emitProgress('resolving-version', `Löse Minecraft-Version ${profile.minecraftVersion} auf ...`)
  const manifest = await fetchVersionManifest()
  const resolvedMinecraftVersion =
    profile.minecraftVersion === 'latest-release'
      ? manifest.latest.release
      : profile.minecraftVersion === 'latest-snapshot'
        ? manifest.latest.snapshot
        : profile.minecraftVersion

  // Loader installers (Forge/NeoForge) need a Java binary before we know the version's own
  // requirement, so probe with a conservative Java 21 request first; vanilla/Fabric/Quilt don't
  // reach this path before the real requirement is known.
  const bootstrapJava = await resolveJava(21, javaOverride ?? profile.javaPath, (m) => emitProgress('resolving-java', m))

  emitProgress('installing-loader', `Bereite Loader "${profile.loader}" vor ...`)
  const versionJson = await resolveLoaderVersionJson(profile, manifest, resolvedMinecraftVersion, bootstrapJava.path, (line) =>
    launchEvents.emitConsoleLine({ profileId: profile.id, stream: 'system', line, timestamp: new Date().toISOString() })
  )

  const hostOs = currentHostOs()
  const hostArch = process.arch

  emitProgress('downloading-libraries', 'Lade Bibliotheken ...')
  const { classpathPaths, downloadTasks, nativesArchives } = resolveLibraries(versionJson, hostOs, hostArch)
  const clientJarPath = join(paths.versionsCacheDir(), versionJson.id, `${versionJson.id}.jar`)
  const clientTask = clientJarDownloadTask(versionJson, clientJarPath)
  const allLibraryTasks: DownloadTask[] = clientTask ? [clientTask, ...downloadTasks] : downloadTasks
  await runWithConcurrencyLimit(allLibraryTasks, MAX_PARALLEL_DOWNLOADS, (task) => downloadFile(task))

  emitProgress('downloading-libraries', 'Lade native Bibliotheken ...')
  await runWithConcurrencyLimit(nativesArchives, MAX_PARALLEL_DOWNLOADS, (task) => downloadFile(task))
  const nativesDir = join(profile.gameDir, 'natives', versionJson.id)
  await extractNatives(nativesArchives, nativesDir)

  emitProgress('downloading-assets', 'Lade Spiel-Assets (Sounds, Texturen) ...')
  const assetIndex = await fetchAssetIndex(versionJson)
  const assetTasks = resolveAssetDownloadTasks(assetIndex)
  await runWithConcurrencyLimit(assetTasks, MAX_PARALLEL_DOWNLOADS, (task) => downloadFile(task))
  if (versionJson.assetIndex) {
    const indexPath = join(assetsRootDir(), 'indexes', `${versionJson.assetIndex.id}.json`)
    await fs.mkdir(join(assetsRootDir(), 'indexes'), { recursive: true })
    await fs.writeFile(indexPath, JSON.stringify(assetIndex), 'utf-8')
  }

  const requiredJava = requiredJavaMajorVersion(versionJson, resolvedMinecraftVersion)
  emitProgress('resolving-java', `Suche Java ${requiredJava} ...`)
  const java =
    requiredJava === bootstrapJava.majorVersion
      ? bootstrapJava
      : await resolveJava(requiredJava, javaOverride ?? profile.javaPath, (m) => emitProgress('resolving-java', m))

  const { command, args } = buildLaunchArguments({
    versionJson,
    versionName: versionJson.id,
    gameDir: profile.gameDir,
    assetsDir: assetsRootDir(),
    nativesDir,
    classpath: [...classpathPaths, clientJarPath],
    classpathSeparator: hostOs === 'windows' ? ';' : ':',
    javaPath: java.path,
    ramMb: profile.ramMb,
    extraJvmArgs: profile.jvmArgs.split(/\s+/).filter((s) => s.length > 0),
    auth,
    hostOs,
    hostArch,
    launcherVersion: appVersion
  })

  emitProgress('starting', 'Starte Minecraft ...')
  const startedAt = Date.now()
  const consoleHistory: string[] = []

  spawnGameProcess(
    profile.id,
    command,
    args,
    profile.gameDir,
    (stream, line) => {
      consoleHistory.push(line)
      if (consoleHistory.length > CONSOLE_HISTORY_LIMIT) consoleHistory.shift()
      launchEvents.emitConsoleLine({ profileId: profile.id, stream, line, timestamp: new Date().toISOString() })
      if (stream === 'system') return
      if (consoleHistory.length === 1) {
        launchEvents.emitProgress({ profileId: profile.id, phase: 'running', message: 'Minecraft läuft', progress: null, total: null })
      }
    },
    (code, signal) => {
      const secondsPlayed = Math.round((Date.now() - startedAt) / 1000)
      void profileStore.recordPlaySession(profile.id, secondsPlayed)
      const wasKilledByUser = signal !== null
      launchEvents.emitProgress({
        profileId: profile.id,
        phase: 'exited',
        message: `Minecraft wurde beendet (Code ${code ?? 'unbekannt'})`,
        progress: null,
        total: null
      })
      if (!wasKilledByUser && code !== 0 && code !== null) {
        void analyzeCrash(profile.gameDir, consoleHistory).then((analysis) => {
          launchEvents.emitCrash({
            profileId: profile.id,
            exitCode: code,
            crashReportPath: analysis.crashReportPath,
            probableCause: analysis.probableCause,
            details: analysis.details
          })
        })
      }
    }
  )
}

export function stopJavaProfile(profileId: string): boolean {
  return stopProfile(profileId)
}

export { isProfileRunning }
