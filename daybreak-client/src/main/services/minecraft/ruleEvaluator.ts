import type { Rule } from './versionJsonTypes'

export type HostOs = 'windows' | 'osx' | 'linux'

export interface RuleContext {
  os: HostOs
  arch: string
  features: Record<string, boolean>
}

export function currentHostOs(platform: NodeJS.Platform = process.platform): HostOs {
  if (platform === 'win32') return 'windows'
  if (platform === 'darwin') return 'osx'
  return 'linux'
}

/**
 * Evaluates a Mojang version-json "rules" array. Rules are evaluated in order; the last
 * matching rule wins, and the default when no rule matches at all is "allow" (per the format
 * Mojang's own launcher uses for conditional libraries and arguments).
 */
export function evaluateRules(rules: Rule[] | undefined, context: RuleContext): boolean {
  if (!rules || rules.length === 0) return true
  let result = false
  for (const rule of rules) {
    if (ruleMatches(rule, context)) {
      result = rule.action === 'allow'
    }
  }
  return result
}

function ruleMatches(rule: Rule, context: RuleContext): boolean {
  if (rule.os) {
    if (rule.os.name && rule.os.name !== context.os) return false
    if (rule.os.arch && rule.os.arch !== context.arch) return false
  }
  if (rule.features) {
    for (const [feature, expected] of Object.entries(rule.features)) {
      if ((context.features[feature] ?? false) !== expected) return false
    }
  }
  return true
}
