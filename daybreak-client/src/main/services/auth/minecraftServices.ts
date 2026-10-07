import {
  MINECRAFT_SERVICES_ENTITLEMENTS_URL,
  MINECRAFT_SERVICES_LOGIN_URL,
  MINECRAFT_SERVICES_PROFILE_URL
} from '@shared/constants'
import { fetchJson, fetchWithRetry, HttpError } from '../network/httpClient'
import type { XstsToken } from './xboxLive'

export interface MinecraftSession {
  accessToken: string
  expiresInSeconds: number
}

interface MinecraftLoginResponse {
  access_token: string
  expires_in: number
}

export async function loginWithXbox(xsts: XstsToken): Promise<MinecraftSession> {
  const response = await fetchJson<MinecraftLoginResponse>(MINECRAFT_SERVICES_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identityToken: `XBL3.0 x=${xsts.userHash};${xsts.token}` })
  })
  return { accessToken: response.access_token, expiresInSeconds: response.expires_in }
}

export interface MinecraftProfile {
  uuid: string
  username: string
  skinUrl: string | null
}

interface MinecraftProfileResponse {
  id: string
  name: string
  skins: Array<{ url: string; state: string }>
}

export async function fetchMinecraftProfile(accessToken: string): Promise<MinecraftProfile> {
  const response = await fetchWithRetry(MINECRAFT_SERVICES_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (response.status === 404) {
    throw new HttpError(
      'Dieses Microsoft-Konto besitzt kein Minecraft: Java Edition Profil. Bitte mit einem Konto anmelden, das das Spiel besitzt.'
    )
  }
  const data = (await response.json()) as MinecraftProfileResponse
  const activeSkin = data.skins.find((s) => s.state === 'ACTIVE') ?? data.skins[0]
  return { uuid: data.id, username: data.name, skinUrl: activeSkin?.url ?? null }
}

interface EntitlementsResponse {
  items: Array<{ name: string }>
}

/** Confirms the account actually owns the game - a Microsoft account can authenticate without owning it. */
export async function ownsMinecraft(accessToken: string): Promise<boolean> {
  const data = await fetchJson<EntitlementsResponse>(MINECRAFT_SERVICES_ENTITLEMENTS_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return data.items.length > 0
}
