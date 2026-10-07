export type Edition = 'java' | 'bedrock'
export type JavaLoader = 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt'
export type BedrockChannel = 'release' | 'preview'
export type Language = 'de' | 'en'
export type PostLaunchBehavior = 'keepOpen' | 'minimize' | 'close'

export interface JavaProfile {
  id: string
  name: string
  edition: 'java'
  minecraftVersion: string
  loader: JavaLoader
  loaderVersion: string | null
  ramMb: number
  jvmArgs: string
  javaPath: string | null
  gameDir: string
  icon: string
  createdAt: string
  updatedAt: string
  lastPlayedAt: string | null
  totalPlaytimeSeconds: number
}

export interface BedrockProfile {
  id: string
  name: string
  edition: 'bedrock'
  channel: BedrockChannel
  icon: string
  createdAt: string
  updatedAt: string
  lastPlayedAt: string | null
  totalPlaytimeSeconds: number
}

export type Profile = JavaProfile | BedrockProfile

export interface MinecraftAccountProfile {
  id: string
  minecraftUuid: string
  minecraftUsername: string
  xuid: string
  skinUrl: string | null
  addedAt: string
  isActive: boolean
  tokenExpiresAt: string
}

export interface AppSettings {
  language: Language
  defaultRamMb: number
  javaPath: string | null
  defaultGameDir: string
  microsoftClientIdOverride: string | null
  hasCurseForgeApiKey: boolean
  discordRpcEnabled: boolean
  postLaunchBehavior: PostLaunchBehavior
  autoUpdateEnabled: boolean
  closeConsoleOnCrashOnly: boolean
}

export interface PartnerServer {
  id: string
  name: string
  address: string
  description: string
  bannerUrl: string | null
  edition: Edition
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  url: string | null
  publishedAt: string
  imageUrl: string | null
}

export interface ServerListEntry {
  id: string
  name: string
  address: string
  profileId: string
}

export interface ServerPingResult {
  online: boolean
  playersOnline: number | null
  playersMax: number | null
  motd: string | null
  versionName: string | null
  latencyMs: number | null
  error: string | null
}

export type ModPlatform = 'modrinth' | 'curseforge'

export interface ModSearchResult {
  platform: ModPlatform
  projectId: string
  slug: string
  name: string
  summary: string
  iconUrl: string | null
  downloads: number
  categories: string[]
  author: string
}

export interface ModVersionOption {
  platform: ModPlatform
  projectId: string
  versionId: string
  versionNumber: string
  fileName: string
  downloadUrl: string | null
  sha1: string | null
  gameVersions: string[]
  loaders: string[]
  dependencies: ModDependencyRef[]
  distributionAllowed: boolean
  projectUrl: string
}

export interface ModDependencyRef {
  platform: ModPlatform
  projectId: string | null
  versionId: string | null
  dependencyType: 'required' | 'optional' | 'incompatible' | 'embedded'
}

export interface InstalledMod {
  id: string
  platform: ModPlatform | 'manual'
  projectId: string | null
  versionId: string | null
  fileName: string
  sha1: string | null
  name: string
  versionNumber: string | null
  enabled: boolean
  installedAt: string
}

export interface ModLockfile {
  profileId: string
  mods: InstalledMod[]
  updatedAt: string
}

export interface LaunchProgressEvent {
  profileId: string
  phase:
    | 'resolving-version'
    | 'downloading-libraries'
    | 'downloading-assets'
    | 'downloading-client'
    | 'installing-loader'
    | 'resolving-java'
    | 'starting'
    | 'running'
    | 'exited'
    | 'error'
  message: string
  progress: number | null
  total: number | null
}

export interface ConsoleLogLine {
  profileId: string
  stream: 'stdout' | 'stderr' | 'system'
  line: string
  timestamp: string
}

export interface CrashSummary {
  profileId: string
  exitCode: number | null
  crashReportPath: string | null
  probableCause: string
  details: string
}

export interface SetupWizardState {
  completed: boolean
  language: Language | null
  javaPath: string | null
  recommendedRamMb: number | null
}
