import { promises as fs } from 'node:fs'
import { join } from 'node:path'

interface CrashRule {
  pattern: RegExp
  cause: string
}

const CRASH_RULES: CrashRule[] = [
  {
    pattern: /java\.lang\.OutOfMemoryError/,
    cause:
      'Nicht genug Arbeitsspeicher (RAM) für Minecraft. Erhöhe den zugewiesenen RAM in den Profil-Einstellungen.'
  },
  {
    pattern: /UnsupportedClassVersionError/,
    cause:
      'Falsche Java-Version: Dieses Minecraft/Mod braucht eine andere Java-Version als die konfigurierte.'
  },
  {
    pattern: /Pixel Format not accelerated|Couldn't set pixel format/,
    cause: 'Grafiktreiber-Problem: Bitte Grafiktreiber aktualisieren.'
  },
  {
    pattern: /mixin.*apply.*failed|MixinApplyError/i,
    cause: 'Ein Mod-Mixin ist mit einem anderen Mod oder der Minecraft-Version inkompatibel.'
  },
  {
    pattern: /Duplicate mod|duplicate.*mod.*id/i,
    cause: 'Ein Mod ist doppelt installiert (zwei Versionen derselben Mod-Datei).'
  },
  {
    pattern: /NoClassDefFoundError|ClassNotFoundException/,
    cause: 'Eine benötigte Mod-Abhängigkeit fehlt oder ist beschädigt.'
  },
  {
    pattern: /Missing or unsupported mandatory dependencies/i,
    cause: 'Ein Mod fehlt eine zwingend benötigte Abhängigkeit (Mod-Liste prüfen).'
  }
]

function findLatestCrashReport(gameDir: string): Promise<string | null> {
  return fs
    .readdir(join(gameDir, 'crash-reports'))
    .then((files) => {
      const reports = files.filter((f) => f.endsWith('.txt')).sort().reverse()
      return reports[0] ? join(gameDir, 'crash-reports', reports[0]) : null
    })
    .catch(() => null)
}

export interface CrashAnalysis {
  crashReportPath: string | null
  probableCause: string
  details: string
}

/** Looks at the process output and the newest crash-report file to produce a readable summary. */
export async function analyzeCrash(gameDir: string, recentLogLines: string[]): Promise<CrashAnalysis> {
  const crashReportPath = await findLatestCrashReport(gameDir)
  let reportContent = ''
  if (crashReportPath) {
    reportContent = await fs.readFile(crashReportPath, 'utf-8').catch(() => '')
  }
  const haystack = `${reportContent}\n${recentLogLines.join('\n')}`

  for (const rule of CRASH_RULES) {
    if (rule.pattern.test(haystack)) {
      return { crashReportPath, probableCause: rule.cause, details: haystack.slice(-4000) }
    }
  }

  return {
    crashReportPath,
    probableCause:
      'Unbekannte Ursache. Prüfe die Konsole und den Crash-Report für Details, oder versuche es mit dem Standardprofil (Vanilla) erneut.',
    details: haystack.slice(-4000)
  }
}
