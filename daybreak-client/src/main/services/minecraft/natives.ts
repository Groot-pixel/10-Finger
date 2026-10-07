import { promises as fs } from 'node:fs'
import AdmZip from 'adm-zip'
import type { DownloadTask } from '../network/downloader'

/** Extracts every downloaded native archive into a fresh per-launch natives directory. */
export async function extractNatives(archives: DownloadTask[], nativesDir: string): Promise<void> {
  await fs.rm(nativesDir, { recursive: true, force: true })
  await fs.mkdir(nativesDir, { recursive: true })
  for (const archive of archives) {
    const zip = new AdmZip(archive.destPath)
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue
      if (entry.entryName.startsWith('META-INF/')) continue
      zip.extractEntryTo(entry, nativesDir, false, true)
    }
  }
}
