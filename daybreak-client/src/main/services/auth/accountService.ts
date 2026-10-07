import { randomUUID } from 'node:crypto'
import type { MinecraftAccountProfile } from '@shared/types'
import type { DeviceCodePrompt } from '@shared/ipc-api'
import { accountStore } from '../storage/accountStore'
import { settingsStore } from '../storage/settingsStore'
import { tokenStore } from './tokenStore'
import {
  MicrosoftAuthCancelledError,
  pollForToken,
  refreshMicrosoftToken,
  requestDeviceCode,
  resolveClientId,
  type MicrosoftTokenResponse
} from './microsoftAuth'
import { authenticateWithXboxLive, authenticateWithXsts } from './xboxLive'
import { fetchMinecraftProfile, loginWithXbox, ownsMinecraft } from './minecraftServices'

let activeLoginController: AbortController | null = null

async function completeXboxToMinecraftChain(microsoftAccessToken: string): Promise<{
  minecraftAccessToken: string
  expiresInSeconds: number
  xuid: string
}> {
  const xbl = await authenticateWithXboxLive(microsoftAccessToken)
  const xsts = await authenticateWithXsts(xbl)
  const session = await loginWithXbox(xsts)
  return { minecraftAccessToken: session.accessToken, expiresInSeconds: session.expiresInSeconds, xuid: xsts.xuid }
}

export async function startMicrosoftLogin(
  onPrompt: (prompt: DeviceCodePrompt) => void
): Promise<MinecraftAccountProfile> {
  const settings = await settingsStore.read()
  const clientId = resolveClientId(settings.microsoftClientIdOverride)

  const deviceCode = await requestDeviceCode(clientId)
  onPrompt({
    userCode: deviceCode.user_code,
    verificationUri: deviceCode.verification_uri,
    expiresInSeconds: deviceCode.expires_in
  })

  const controller = new AbortController()
  activeLoginController = controller
  let tokens: MicrosoftTokenResponse
  try {
    tokens = await pollForToken(clientId, deviceCode, controller.signal)
  } finally {
    activeLoginController = null
  }

  const { minecraftAccessToken, expiresInSeconds, xuid } = await completeXboxToMinecraftChain(tokens.access_token)

  const owns = await ownsMinecraft(minecraftAccessToken)
  if (!owns) {
    throw new Error(
      'Dieses Microsoft-Konto besitzt Minecraft: Java Edition nicht. Bitte mit dem Konto anmelden, mit dem das Spiel gekauft wurde.'
    )
  }

  const profile = await fetchMinecraftProfile(minecraftAccessToken)

  const accountId = randomUUID()
  await tokenStore.saveMicrosoftRefreshToken(accountId, tokens.refresh_token)
  await tokenStore.saveMinecraftAccessToken(accountId, minecraftAccessToken)

  const account: MinecraftAccountProfile = {
    id: accountId,
    minecraftUuid: profile.uuid,
    minecraftUsername: profile.username,
    xuid,
    skinUrl: profile.skinUrl,
    addedAt: new Date().toISOString(),
    isActive: true,
    tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
  }

  const existing = await accountStore.list()
  await accountStore.upsert(account)
  if (existing.length > 0) {
    await accountStore.setActive(accountId)
  }
  return account
}

export function cancelMicrosoftLogin(): void {
  activeLoginController?.abort()
}

export { MicrosoftAuthCancelledError }

/** Returns a Minecraft access token guaranteed valid for at least 5 more minutes, refreshing if needed. */
export async function getValidMinecraftAccessToken(account: MinecraftAccountProfile): Promise<string> {
  const expiresAt = new Date(account.tokenExpiresAt).getTime()
  const stillValid = expiresAt - Date.now() > 5 * 60 * 1000
  if (stillValid) {
    const cached = await tokenStore.getMinecraftAccessToken(account.id)
    if (cached) return cached
  }

  const refreshToken = await tokenStore.getMicrosoftRefreshToken(account.id)
  if (!refreshToken) {
    throw new Error(`Für Konto ${account.minecraftUsername} liegt kein Anmelde-Token vor. Bitte erneut anmelden.`)
  }
  const settings = await settingsStore.read()
  const clientId = resolveClientId(settings.microsoftClientIdOverride)
  const tokens = await refreshMicrosoftToken(clientId, refreshToken)
  const { minecraftAccessToken, expiresInSeconds } = await completeXboxToMinecraftChain(tokens.access_token)

  await tokenStore.saveMicrosoftRefreshToken(account.id, tokens.refresh_token)
  await tokenStore.saveMinecraftAccessToken(account.id, minecraftAccessToken)
  await accountStore.upsert({
    ...account,
    tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
  })

  return minecraftAccessToken
}
