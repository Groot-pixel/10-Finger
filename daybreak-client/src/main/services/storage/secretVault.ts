import { safeStorage } from 'electron'
import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import { paths } from './paths'
import { withMutex } from './mutex'

export class SecretVaultError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecretVaultError'
  }
}

type SecretMap = Record<string, string>

const VAULT_MUTEX_KEY = 'secret-vault'

/**
 * Encrypts every secret (OAuth refresh tokens, the CurseForge API key) with Electron's
 * safeStorage, which delegates to the OS keychain (DPAPI on Windows, Keychain on macOS,
 * libsecret on Linux). On a system where no OS secret store is available, we refuse to fall
 * back to plaintext and surface a clear error instead - callers must handle SecretVaultError.
 */
export class SecretVault {
  private cache: SecretMap | null = null

  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  async get(key: string): Promise<string | null> {
    const map = await this.load()
    return map[key] ?? null
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new SecretVaultError(
        'Der verschlüsselte Speicher ist auf diesem System nicht verfügbar (kein OS-Schlüsselbund gefunden, z. B. fehlendes libsecret unter Linux). Anmeldung und API-Schlüssel können nicht sicher gespeichert werden.'
      )
    }
    await withMutex(VAULT_MUTEX_KEY, async () => {
      const map = await this.loadUnsafe()
      map[key] = value
      await this.persist(map)
    })
  }

  async delete(key: string): Promise<void> {
    await withMutex(VAULT_MUTEX_KEY, async () => {
      const map = await this.loadUnsafe()
      delete map[key]
      await this.persist(map)
    })
  }

  private async load(): Promise<SecretMap> {
    if (this.cache) return this.cache
    return withMutex(VAULT_MUTEX_KEY, () => this.loadUnsafe())
  }

  private async loadUnsafe(): Promise<SecretMap> {
    if (this.cache) return this.cache
    try {
      const encrypted = await fs.readFile(paths.secretVaultFile())
      if (!this.isAvailable()) {
        throw new SecretVaultError(
          'Verschlüsselter Speicher vorhanden, aber safeStorage ist auf diesem System nicht verfügbar.'
        )
      }
      const decrypted = safeStorage.decryptString(encrypted)
      const map = JSON.parse(decrypted) as SecretMap
      this.cache = map
      return map
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.cache = {}
        return this.cache
      }
      if (error instanceof SecretVaultError) throw error
      throw new SecretVaultError('Der verschlüsselte Speicher konnte nicht gelesen werden (beschädigt?).')
    }
  }

  private async persist(map: SecretMap): Promise<void> {
    const encrypted = safeStorage.encryptString(JSON.stringify(map))
    await fs.mkdir(dirname(paths.secretVaultFile()), { recursive: true })
    const tmpPath = `${paths.secretVaultFile()}.${process.pid}.${Date.now()}.tmp`
    await fs.writeFile(tmpPath, encrypted)
    await fs.rename(tmpPath, paths.secretVaultFile())
    this.cache = map
  }
}

export const secretVault = new SecretVault()
