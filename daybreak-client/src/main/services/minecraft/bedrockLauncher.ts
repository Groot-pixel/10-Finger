import { spawn } from 'node:child_process'
import type { BedrockProfile } from '@shared/types'

const BEDROCK_APP_IDS: Record<BedrockProfile['channel'], string> = {
  release: 'Microsoft.MinecraftUWP_8wekyb3d8bbwe!App',
  preview: 'Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe!App'
}

/**
 * Minecraft Bedrock ships as a UWP app, not a standalone .exe, so it cannot be spawned directly
 * like a Java process. The documented way to launch a UWP app from another program is to hand
 * its AppsFolder shell path to explorer.exe - still a plain argv call, never a shell string.
 * This only works on Windows and only if the matching edition is already installed from the
 * Microsoft Store; Daybreak Client never downloads or modifies Bedrock itself.
 */
export async function launchBedrockProfile(profile: BedrockProfile): Promise<void> {
  if (process.platform !== 'win32') {
    throw new Error(
      'Minecraft Bedrock kann nur unter Windows gestartet werden (UWP-App über den Microsoft Store).'
    )
  }
  const appId = BEDROCK_APP_IDS[profile.channel]
  await new Promise<void>((resolve, reject) => {
    const child = spawn('explorer.exe', [`shell:AppsFolder\\${appId}`], { shell: false })
    child.on('error', (error) => reject(error))
    child.on('exit', () => resolve())
  })
}
