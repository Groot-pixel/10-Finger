import { join, normalize, relative, isAbsolute } from 'node:path'

export class PathTraversalError extends Error {
  constructor(entryPath: string) {
    super(`Unsicherer Pfad in Archiv erkannt, Import abgebrochen: "${entryPath}"`)
    this.name = 'PathTraversalError'
  }
}

/**
 * Joins `relativePath` onto `baseDir` and verifies the result cannot escape `baseDir` - the
 * standard "zip-slip" guard every zip-entry or archive-relative-path write must go through.
 * A malicious .mrpack/CurseForge modpack or profile export could otherwise use "../../" entry
 * names to overwrite arbitrary files on disk.
 */
export function resolveWithinBase(baseDir: string, relativePath: string): string {
  const normalizedRelative = normalize(relativePath)
  if (isAbsolute(normalizedRelative) || normalizedRelative.split(/[\\/]/).includes('..')) {
    throw new PathTraversalError(relativePath)
  }
  const destPath = join(baseDir, normalizedRelative)
  const rel = relative(baseDir, destPath)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new PathTraversalError(relativePath)
  }
  return destPath
}
