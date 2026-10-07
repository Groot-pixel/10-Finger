import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import type { z } from 'zod'
import { withMutex } from './mutex'

export class JsonStoreError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'JsonStoreError'
  }
}

/**
 * A single JSON file validated against a zod schema on every read, written atomically
 * (write to a temp file in the same directory, then rename) so a crash or power loss mid-write
 * can never leave a half-written, corrupt file behind.
 */
export class JsonStore<T> {
  constructor(
    private readonly filePath: string,
    private readonly schema: z.ZodType<T>,
    private readonly defaultValue: () => T
  ) {}

  async read(): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      const result = this.schema.safeParse(parsed)
      if (!result.success) {
        throw new JsonStoreError(
          `Datei ${this.filePath} ist beschädigt oder veraltet: ${result.error.message}`
        )
      }
      return result.data
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        const fallback = this.defaultValue()
        await this.write(fallback)
        return fallback
      }
      if (error instanceof JsonStoreError) {
        throw error
      }
      throw new JsonStoreError(`Konnte ${this.filePath} nicht lesen`, error)
    }
  }

  async write(value: T): Promise<void> {
    return withMutex(this.filePath, async () => {
      const validated = this.schema.safeParse(value)
      if (!validated.success) {
        throw new JsonStoreError(`Ungültige Daten für ${this.filePath}: ${validated.error.message}`)
      }
      await fs.mkdir(dirname(this.filePath), { recursive: true })
      const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`
      try {
        await fs.writeFile(tmpPath, JSON.stringify(validated.data, null, 2), 'utf-8')
        await fs.rename(tmpPath, this.filePath)
      } catch (error) {
        await fs.rm(tmpPath, { force: true }).catch(() => {})
        throw new JsonStoreError(`Konnte ${this.filePath} nicht schreiben`, error)
      }
    })
  }

  async update(mutator: (current: T) => T): Promise<T> {
    return withMutex(this.filePath, async () => {
      const current = await this.readUnsafe()
      const next = mutator(current)
      const validated = this.schema.safeParse(next)
      if (!validated.success) {
        throw new JsonStoreError(`Ungültige Daten für ${this.filePath}: ${validated.error.message}`)
      }
      await fs.mkdir(dirname(this.filePath), { recursive: true })
      const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`
      await fs.writeFile(tmpPath, JSON.stringify(validated.data, null, 2), 'utf-8')
      await fs.rename(tmpPath, this.filePath)
      return validated.data
    })
  }

  /** Internal: read without acquiring the mutex (caller already holds it via update()). */
  private async readUnsafe(): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      const result = this.schema.safeParse(parsed)
      if (!result.success) {
        throw new JsonStoreError(
          `Datei ${this.filePath} ist beschädigt oder veraltet: ${result.error.message}`
        )
      }
      return result.data
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return this.defaultValue()
      }
      if (error instanceof JsonStoreError) {
        throw error
      }
      throw new JsonStoreError(`Konnte ${this.filePath} nicht lesen`, error)
    }
  }
}
