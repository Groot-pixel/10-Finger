import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fetchWithRetry } from '../network/httpClient'
import { paths } from '../storage/paths'

const MINECRAFT_SKIN_UPLOAD_URL = 'https://api.minecraftservices.com/minecraft/profile/skins'

export async function listSkinLibrary(): Promise<string[]> {
  const dir = paths.skinsLibraryDir()
  await fs.mkdir(dir, { recursive: true })
  const files = await fs.readdir(dir)
  return files.filter((f) => f.endsWith('.png')).map((f) => join(dir, f))
}

async function saveToLibrary(buffer: Buffer): Promise<string> {
  const dir = paths.skinsLibraryDir()
  await fs.mkdir(dir, { recursive: true })
  const destPath = join(dir, `${randomUUID()}.png`)
  await fs.writeFile(destPath, buffer)
  return destPath
}

/**
 * Uploads a new skin to Minecraft Services (so it shows up in-game and on the player's
 * profile everywhere) and keeps a local copy in the skin library for quick re-use.
 */
export async function setActiveSkin(
  accessToken: string,
  variant: 'classic' | 'slim',
  source: 'url' | 'file',
  value: string
): Promise<void> {
  let buffer: Buffer | null = null
  if (source === 'file') {
    buffer = await fs.readFile(value)
  }

  if (source === 'url') {
    const response = await fetchWithRetry(MINECRAFT_SKIN_UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant, url: value })
    })
    if (!response.ok) {
      throw new Error(`Skin konnte nicht gesetzt werden (HTTP ${response.status})`)
    }
    const imageResponse = await fetchWithRetry(value)
    buffer = Buffer.from(await imageResponse.arrayBuffer())
  } else if (buffer) {
    const form = new FormData()
    form.append('variant', variant)
    form.append('file', new Blob([buffer], { type: 'image/png' }), 'skin.png')
    const response = await fetch(MINECRAFT_SKIN_UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    })
    if (!response.ok) {
      throw new Error(`Skin konnte nicht hochgeladen werden (HTTP ${response.status})`)
    }
  }

  if (buffer) await saveToLibrary(buffer)
}
