import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream, promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import {
  DOWNLOAD_RETRY_ATTEMPTS,
  DOWNLOAD_RETRY_BASE_DELAY_MS,
  NETWORK_TIMEOUT_MS
} from '@shared/constants'

export class DownloadError extends Error {
  constructor(
    message: string,
    public readonly url: string
  ) {
    super(message)
    this.name = 'DownloadError'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sha1File(filePath: string): Promise<string> {
  const hash = createHash('sha1')
  await pipeline(createReadStream(filePath), hash)
  return hash.digest('hex')
}

async function fileMatchesSha1(filePath: string, expectedSha1: string | null): Promise<boolean> {
  if (!expectedSha1) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
  try {
    const actual = await sha1File(filePath)
    return actual.toLowerCase() === expectedSha1.toLowerCase()
  } catch {
    return false
  }
}

export interface DownloadTask {
  url: string
  destPath: string
  expectedSha1: string | null
  expectedSize?: number
}

export interface DownloadReport {
  task: DownloadTask
  skipped: boolean
}

/**
 * Downloads one file to a temp path, verifies its SHA1 (when known), then renames it into
 * place - so a crash or interrupted download never leaves a corrupt file at destPath, and the
 * next launch attempt will simply see it missing and retry. Already-valid files are skipped.
 */
export async function downloadFile(
  task: DownloadTask,
  retries = DOWNLOAD_RETRY_ATTEMPTS
): Promise<DownloadReport> {
  if (await fileMatchesSha1(task.destPath, task.expectedSha1)) {
    return { task, skipped: true }
  }

  let lastError: unknown = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    const tmpPath = `${task.destPath}.${process.pid}.${Date.now()}.part`
    try {
      await fs.mkdir(dirname(task.destPath), { recursive: true })
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS * 4)
      try {
        const response = await fetch(task.url, { signal: controller.signal })
        if (!response.ok || !response.body) {
          throw new DownloadError(`HTTP ${response.status} beim Herunterladen von ${task.url}`, task.url)
        }
        const nodeStream = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])
        await pipeline(nodeStream, createWriteStream(tmpPath))
      } finally {
        clearTimeout(timeout)
      }

      if (task.expectedSha1) {
        const actualSha1 = await sha1File(tmpPath)
        if (actualSha1.toLowerCase() !== task.expectedSha1.toLowerCase()) {
          throw new DownloadError(
            `SHA1-Prüfung fehlgeschlagen für ${task.destPath} (erwartet ${task.expectedSha1}, erhalten ${actualSha1})`,
            task.url
          )
        }
      }

      await fs.rename(tmpPath, task.destPath)
      return { task, skipped: false }
    } catch (error) {
      await fs.rm(tmpPath, { force: true }).catch(() => {})
      lastError = error
      if (attempt < retries) {
        await sleep(DOWNLOAD_RETRY_BASE_DELAY_MS * 2 ** attempt)
      }
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError)
  throw new DownloadError(
    `Download von ${task.url} nach ${retries + 1} Versuchen fehlgeschlagen: ${reason}`,
    task.url
  )
}
