import { ipcMain, app } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { launchRequestSchema } from '@shared/schemas'
import { respond, validated } from '../respond'
import { profileStore } from '../../services/storage/profileStore'
import { accountStore } from '../../services/storage/accountStore'
import { settingsStore } from '../../services/storage/settingsStore'
import { getValidMinecraftAccessToken } from '../../services/auth/accountService'
import { launchJavaProfile, isProfileRunning, stopJavaProfile } from '../../services/minecraft/launchOrchestrator'
import { launchBedrockProfile } from '../../services/minecraft/bedrockLauncher'
import type { LaunchAuth } from '../../services/minecraft/argumentBuilder'

async function buildAuthForActiveAccount(): Promise<LaunchAuth> {
  const account = await accountStore.getActive()
  if (!account) {
    throw new Error('Kein Microsoft-Konto angemeldet. Bitte zuerst unter "Konten" anmelden.')
  }
  const settings = await settingsStore.read()
  const accessToken = await getValidMinecraftAccessToken(account)
  return {
    accessToken,
    uuid: account.minecraftUuid,
    username: account.minecraftUsername,
    xuid: account.xuid,
    clientId: settings.microsoftClientIdOverride ?? process.env.DAYBREAK_MICROSOFT_CLIENT_ID ?? ''
  }
}

export function registerLaunchHandlers(): void {
  ipcMain.handle(IPC.launchStart, (_event, profileId: unknown) =>
    validated(launchRequestSchema, { profileId }, async ({ profileId: id }) => {
      const profile = await profileStore.get(id)
      if (!profile) throw new Error(`Profil ${id} wurde nicht gefunden`)

      if (profile.edition === 'bedrock') {
        await launchBedrockProfile(profile)
        return
      }

      const auth = await buildAuthForActiveAccount()
      await launchJavaProfile(profile, auth, null, app.getVersion())
    })
  )

  ipcMain.handle(IPC.launchStop, (_event, profileId: unknown) =>
    respond(async () => {
      const result = launchRequestSchema.safeParse({ profileId })
      if (!result.success) throw new Error('Ungültige Profil-ID')
      const stopped = stopJavaProfile(result.data.profileId)
      if (!stopped) throw new Error('Dieses Profil läuft nicht')
    })
  )

  ipcMain.handle(IPC.launchIsRunning, (_event, profileId: unknown) => {
    const result = launchRequestSchema.safeParse({ profileId })
    return result.success ? isProfileRunning(result.data.profileId) : false
  })
}
