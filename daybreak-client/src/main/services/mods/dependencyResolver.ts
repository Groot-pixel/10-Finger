import type { ModVersionOption } from '@shared/types'

export interface DependencyNode {
  key: string
  version: ModVersionOption
}

export function nodeKey(platform: string, projectId: string): string {
  return `${platform}:${projectId}`
}

/**
 * Topologically sorts a mod and its required/embedded dependencies so dependencies always
 * install before the mod that needs them. Pure and network-free: the caller already resolved
 * every dependency's chosen version into `nodesByKey` before calling this.
 */
export function resolveInstallOrder(
  target: DependencyNode,
  nodesByKey: Map<string, DependencyNode>
): DependencyNode[] {
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const order: DependencyNode[] = []

  function visit(node: DependencyNode): void {
    if (visited.has(node.key)) return
    if (visiting.has(node.key)) {
      throw new Error(`Zirkuläre Mod-Abhängigkeit erkannt bei "${node.key}"`)
    }
    visiting.add(node.key)
    for (const dep of node.version.dependencies) {
      if (dep.dependencyType !== 'required' && dep.dependencyType !== 'embedded') continue
      if (!dep.projectId) continue
      const depKey = nodeKey(dep.platform, dep.projectId)
      if (depKey === node.key) continue
      const depNode = nodesByKey.get(depKey)
      if (!depNode) {
        throw new Error(`Benötigte Abhängigkeit "${depKey}" konnte nicht aufgelöst werden`)
      }
      visit(depNode)
    }
    visiting.delete(node.key)
    visited.add(node.key)
    order.push(node)
  }

  visit(target)
  return order
}

export interface InstalledModRef {
  platform: string
  projectId: string | null
}

/** Finds already-installed mods that the target mod explicitly declares incompatible with it. */
export function findIncompatibilities(target: DependencyNode, installed: InstalledModRef[]): string[] {
  const conflicts: string[] = []
  for (const dep of target.version.dependencies) {
    if (dep.dependencyType !== 'incompatible' || !dep.projectId) continue
    const match = installed.find((m) => m.platform === dep.platform && m.projectId === dep.projectId)
    if (match) conflicts.push(nodeKey(dep.platform, dep.projectId))
  }
  return conflicts
}
