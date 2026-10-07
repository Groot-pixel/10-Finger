import { APP_NAME } from '@shared/constants'
import { evaluateRules, type HostOs, type RuleContext } from './ruleEvaluator'
import type { ArgumentValue, VersionJson } from './versionJsonTypes'

export interface LaunchAuth {
  accessToken: string
  uuid: string
  username: string
  xuid: string
  clientId: string
}

export interface BuildLaunchArgumentsOptions {
  versionJson: VersionJson
  versionName: string
  gameDir: string
  assetsDir: string
  nativesDir: string
  classpath: string[]
  classpathSeparator: ':' | ';'
  javaPath: string
  ramMb: number
  extraJvmArgs: string[]
  auth: LaunchAuth
  hostOs: HostOs
  hostArch: string
  launcherVersion: string
  width?: number
  height?: number
}

export interface BuiltLaunchCommand {
  command: string
  args: string[]
}

function substitute(token: string, values: Record<string, string>): string {
  return token.replace(/\$\{([a-zA-Z_]+)\}/g, (match, key: string) => values[key] ?? match)
}

function resolveArgumentValues(
  entries: ArgumentValue[] | undefined,
  ruleContext: RuleContext
): string[] {
  if (!entries) return []
  const result: string[] = []
  for (const entry of entries) {
    if (typeof entry === 'string') {
      result.push(entry)
      continue
    }
    if (evaluateRules(entry.rules, ruleContext)) {
      if (Array.isArray(entry.value)) {
        result.push(...entry.value)
      } else {
        result.push(entry.value)
      }
    }
  }
  return result
}

function legacyMinecraftArgumentsToTokens(minecraftArguments: string): string[] {
  return minecraftArguments.split(/\s+/).filter((token) => token.length > 0)
}

function defaultJvmArgTemplate(): string[] {
  return [
    '-Djava.library.path=${natives_directory}',
    '-Dminecraft.launcher.brand=${launcher_name}',
    '-Dminecraft.launcher.version=${launcher_version}',
    '-cp',
    '${classpath}'
  ]
}

function defaultGameArgTemplate(): string[] {
  return [
    '--username',
    '${auth_player_name}',
    '--version',
    '${version_name}',
    '--gameDir',
    '${game_directory}',
    '--assetsDir',
    '${assets_root}',
    '--assetIndex',
    '${assets_index_name}',
    '--uuid',
    '${auth_uuid}',
    '--accessToken',
    '${auth_access_token}',
    '--userType',
    '${user_type}',
    '--versionType',
    '${version_type}'
  ]
}

/**
 * Builds the full `java [jvm args] <mainClass> [game args]` invocation for a resolved,
 * loader-merged version JSON. Pure and side-effect free so it can be unit tested without
 * spawning anything or touching the filesystem - the only inputs are the data already
 * resolved by versionManifest/libraries/javaLocator.
 */
export function buildLaunchArguments(options: BuildLaunchArgumentsOptions): BuiltLaunchCommand {
  const { versionJson } = options
  const ruleContext: RuleContext = {
    os: options.hostOs,
    arch: options.hostArch,
    features: {
      has_custom_resolution: Boolean(options.width && options.height),
      is_demo_user: false
    }
  }

  const minHeapMb = Math.min(options.ramMb, 1024)
  const substitutions: Record<string, string> = {
    auth_player_name: options.auth.username,
    version_name: options.versionName,
    game_directory: options.gameDir,
    assets_root: options.assetsDir,
    assets_index_name: versionJson.assets ?? versionJson.assetIndex?.id ?? versionJson.id,
    auth_uuid: options.auth.uuid,
    auth_access_token: options.auth.accessToken,
    auth_xuid: options.auth.xuid,
    clientid: options.auth.clientId,
    user_type: 'msa',
    version_type: versionJson.type ?? 'release',
    natives_directory: options.nativesDir,
    launcher_name: APP_NAME,
    launcher_version: options.launcherVersion,
    classpath: options.classpath.join(options.classpathSeparator),
    resolution_width: String(options.width ?? 925),
    resolution_height: String(options.height ?? 530)
  }

  let gameArgTokens: string[]
  let jvmArgTokens: string[]

  if (versionJson.arguments) {
    jvmArgTokens = resolveArgumentValues(versionJson.arguments.jvm, ruleContext)
    gameArgTokens = resolveArgumentValues(versionJson.arguments.game, ruleContext)
    if (jvmArgTokens.length === 0) jvmArgTokens = defaultJvmArgTemplate()
  } else if (versionJson.minecraftArguments) {
    jvmArgTokens = defaultJvmArgTemplate()
    gameArgTokens = legacyMinecraftArgumentsToTokens(versionJson.minecraftArguments)
  } else {
    jvmArgTokens = defaultJvmArgTemplate()
    gameArgTokens = defaultGameArgTemplate()
  }

  const jvmArgs = jvmArgTokens.map((token) => substitute(token, substitutions))
  const gameArgs = gameArgTokens.map((token) => substitute(token, substitutions))

  if (!versionJson.mainClass) {
    throw new Error(`Version ${versionJson.id} enthält keine mainClass`)
  }

  const args = [
    `-Xms${minHeapMb}M`,
    `-Xmx${options.ramMb}M`,
    ...jvmArgs,
    ...options.extraJvmArgs,
    versionJson.mainClass,
    ...gameArgs
  ]

  return { command: options.javaPath, args }
}
