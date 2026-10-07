import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { shell } from 'electron'
import { profileStore } from '../storage/profileStore'

function screenshotsDirFor(gameDir: string): string {
  return join(gameDir, 'screenshots')
}

export async function listScreenshots(profileId: string): Promise<string[]> {
  const profile = await profileStore.get(profileId)
  if (!profile || profile.edition !== 'java') return []
  const dir = screenshotsDirFor(profile.gameDir)
  try {
    const files = await fs.readdir(dir)
    return files
      .filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
      .toSorted()
      .toReversed()
      .map((f) => join(dir, f))
  } catch {
    return []
  }
}

export async function openScreenshotsFolder(profileId: string): Promise<void> {
  const profile = await profileStore.get(profileId)
  if (!profile || profile.edition !== 'java') {
    throw new Error('Screenshots sind nur für Java-Profile verfügbar')
  }
  const dir = screenshotsDirFor(profile.gameDir)
  await fs.mkdir(dir, { recursive: true })
  const errorMessage = await shell.openPath(dir)
  if (errorMessage) {
    throw new Error(`Ordner konnte nicht geöffnet werden: ${errorMessage}`)
  }
}
