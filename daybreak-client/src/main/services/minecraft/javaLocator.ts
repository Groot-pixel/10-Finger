import { exec } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { ADOPTIUM_API_BASE } from '@shared/constants'
import { fetchJson } from '../network/httpClient'
import { downloadFile } from '../network/downloader'
import { paths } from '../storage/paths'
import AdmZip from 'adm-zip'

const execAsync = promisify(exec)

export interface DetectedJava {
  path: string
  version: string
  majorVersion: number
}

function parseJavaVersion(versionOutput: string): { version: string; majorVersion: number } | null {
  const match = versionOutput.match(/version "?(\d+)(?:\.(\d+))?[^"]*"?/)
  if (!match) return null
  const first = Number(match[1])
  const second = match[2] ? Number(match[2]) : 0
  // Java 8 and earlier reports as "1.8.x"; Java 9+ reports its major version directly.
  const majorVersion = first === 1 ? second : first
  return { version: versionOutput.trim(), majorVersion }
}

async function probeJavaBinary(javaPath: string): Promise<DetectedJava | null> {
  try {
    const { stderr, stdout } = await execAsync(`"${javaPath}" -version`, { timeout: 5000 })
    const parsed = parseJavaVersion(`${stderr}${stdout}`)
    if (!parsed) return null
    return { path: javaPath, ...parsed }
  } catch {
    return null
  }
}

function candidateDirsForPlatform(): string[] {
  if (process.platform === 'win32') {
    return [
      'C:\\Program Files\\Java',
      'C:\\Program Files\\Eclipse Adoptium',
      'C:\\Program Files (x86)\\Java'
    ]
  }
  if (process.platform === 'darwin') {
    return ['/Library/Java/JavaVirtualMachines', '/opt/homebrew/opt']
  }
  return ['/usr/lib/jvm', '/usr/java', '/opt/java']
}

function binaryNameForPlatform(): string {
  return process.platform === 'win32' ? 'java.exe' : 'java'
}

async function findJavaBinariesUnder(dir: string): Promise<string[]> {
  const found: string[] = []
  let entries: string[]
  try {
    entries = await fs.readdir(dir)
  } catch {
    return found
  }
  for (const entry of entries) {
    const candidates = [
      join(dir, entry, 'bin', binaryNameForPlatform()),
      join(dir, entry, 'Contents', 'Home', 'bin', binaryNameForPlatform())
    ]
    for (const candidate of candidates) {
      try {
        await fs.access(candidate)
        found.push(candidate)
      } catch {
        // not present, ignore
      }
    }
  }
  return found
}

/** Scans PATH plus common per-OS install locations for usable Java runtimes. */
export async function scanInstalledJava(): Promise<DetectedJava[]> {
  const results: DetectedJava[] = []
  const seen = new Set<string>()

  const pathProbe = await probeJavaBinary(binaryNameForPlatform())
  if (pathProbe) {
    results.push(pathProbe)
    seen.add(pathProbe.path)
  }

  for (const dir of candidateDirsForPlatform()) {
    const binaries = await findJavaBinariesUnder(dir)
    for (const binary of binaries) {
      if (seen.has(binary)) continue
      const probed = await probeJavaBinary(binary)
      if (probed) {
        results.push(probed)
        seen.add(probed.path)
      }
    }
  }

  return results;
}

/** Picks the best already-installed Java for a required major version, if any. */
export async function findJavaForVersion(majorVersion: number): Promise<DetectedJava | null> {
  const installed = await scanInstalledJava()
  const exact = installed.find((j) => j.majorVersion === majorVersion)
  if (exact) return exact
  const newer = installed
    .filter((j) => j.majorVersion >= majorVersion)
    .toSorted((a, b) => a.majorVersion - b.majorVersion)
  return newer[0] ?? null
}

interface AdoptiumAssetResponse {
  binaries: Array<{
    package: { link: string; checksum: string }
  }>
}

function adoptiumOsName(): string {
  if (process.platform === 'win32') return 'windows'
  if (process.platform === 'darwin') return 'mac'
  return 'linux'
}

function adoptiumArch(): string {
  if (process.arch === 'arm64') return 'aarch64'
  return 'x64'
}

/**
 * Downloads a matching Temurin (Adoptium) JRE for the requested major version (17 or 21) when
 * no suitable local Java was found, and extracts it under the app's runtimes directory.
 */
export async function downloadJavaRuntime(
  majorVersion: number,
  onProgress?: (message: string) => void
): Promise<DetectedJava> {
  onProgress?.(`Suche passende Java-${majorVersion}-Laufzeit bei Adoptium ...`)
  const url =
    `${ADOPTIUM_API_BASE}/assets/latest/${majorVersion}/hotspot` +
    `?os=${adoptiumOsName()}&architecture=${adoptiumArch()}&image_type=jre&vendor=eclipse`
  const assets = await fetchJson<AdoptiumAssetResponse[]>(url)
  const asset = assets[0]?.binaries[0]
  if (!asset) {
    throw new Error(
      `Keine passende Java-${majorVersion}-Laufzeit für dieses System gefunden. Bitte Java manuell installieren und in den Einstellungen auswählen.`
    )
  }

  const runtimeDir = join(paths.javaRuntimesDir(), `jre-${majorVersion}`)
  const archivePath = join(paths.javaRuntimesDir(), `jre-${majorVersion}-download.zip`)
  onProgress?.(`Lade Java ${majorVersion} herunter ...`)
  await downloadFile({ url: asset.package.link, destPath: archivePath, expectedSha1: null })

  onProgress?.('Entpacke Java-Laufzeit ...')
  await fs.rm(runtimeDir, { recursive: true, force: true })
  await fs.mkdir(runtimeDir, { recursive: true })
  const zip = new AdmZip(archivePath)
  zip.extractAllTo(runtimeDir, true)
  await fs.rm(archivePath, { force: true })

  const extractedRoot = (await fs.readdir(runtimeDir))[0]
  if (!extractedRoot) {
    throw new Error('Java-Laufzeit konnte nicht entpackt werden')
  }
  const javaBinary =
    process.platform === 'darwin'
      ? join(runtimeDir, extractedRoot, 'Contents', 'Home', 'bin', binaryNameForPlatform())
      : join(runtimeDir, extractedRoot, 'bin', binaryNameForPlatform())

  const probed = await probeJavaBinary(javaBinary)
  if (!probed) {
    throw new Error('Heruntergeladene Java-Laufzeit konnte nicht gestartet werden')
  }
  return probed
}

/** Resolves a usable Java binary for the given required major version, preferring an explicit override. */
export async function resolveJava(
  requiredMajorVersion: number,
  overridePath: string | null,
  onProgress?: (message: string) => void
): Promise<DetectedJava> {
  if (overridePath) {
    const probed = await probeJavaBinary(overridePath)
    if (!probed) {
      throw new Error(`Der konfigurierte Java-Pfad "${overridePath}" ist ungültig oder nicht ausführbar`)
    }
    return probed
  }
  const existing = await findJavaForVersion(requiredMajorVersion)
  if (existing) return existing
  return downloadJavaRuntime(requiredMajorVersion, onProgress)
}
