/**
 * Single source of truth for the product name. Change this constant to rebrand the app
 * everywhere (window title, user-agent strings, userData folder name, build artifacts).
 */
export const APP_NAME = 'Daybreak Client'

export const APP_ID = 'com.daybreakclient.launcher'

export const APP_VERSION_FALLBACK = '0.1.0'

/** Required by Modrinth's API ToS: every request must carry an identifying User-Agent. */
export function buildUserAgent(version: string): string {
  return `${APP_ID}/${version} (${APP_NAME}; +https://github.com/groot-pixel/10-finger)`
}

export const MOJANG_VERSION_MANIFEST_URL =
  'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'
export const MOJANG_RESOURCES_BASE_URL = 'https://resources.download.minecraft.net'

export const MICROSOFT_OAUTH_DEVICE_CODE_URL =
  'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode'
export const MICROSOFT_OAUTH_TOKEN_URL =
  'https://login.microsoftonline.com/consumers/oauth2/v2.0/token'
export const XBOX_LIVE_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate'
export const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize'
export const MINECRAFT_SERVICES_LOGIN_URL =
  'https://api.minecraftservices.com/authentication/login_with_xbox'
export const MINECRAFT_SERVICES_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile'
export const MINECRAFT_SERVICES_ENTITLEMENTS_URL =
  'https://api.minecraftservices.com/entitlements/mcstore'

export const FABRIC_META_URL = 'https://meta.fabricmc.net/v2'
export const QUILT_META_URL = 'https://meta.quiltmc.org/v3'
export const NEOFORGE_MAVEN_URL = 'https://maven.neoforged.net/releases'
export const FORGE_MAVEN_URL = 'https://maven.minecraftforge.net'
export const FORGE_PROMOTIONS_URL =
  'https://maven.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'

export const MODRINTH_API_BASE = 'https://api.modrinth.com/v2'
export const CURSEFORGE_API_BASE = 'https://api.curseforge.com/v1'
/** CurseForge's official "Minecraft" game id in their catalog. */
export const CURSEFORGE_MINECRAFT_GAME_ID = 432
export const CURSEFORGE_MOD_CLASS_ID = 6

export const ADOPTIUM_API_BASE = 'https://api.adoptium.net/v3'

export const DEFAULT_RAM_MB = 4096
export const MIN_RAM_MB = 1024
export const MAX_PARALLEL_DOWNLOADS = 8
export const DOWNLOAD_RETRY_ATTEMPTS = 4
export const DOWNLOAD_RETRY_BASE_DELAY_MS = 500
export const NETWORK_TIMEOUT_MS = 15000

export const DEFAULT_PROFILE_ID = 'daybreak-default'
export const DEFAULT_PROFILE_NAME = 'DAYBREAK'
