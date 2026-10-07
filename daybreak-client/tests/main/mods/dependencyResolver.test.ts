import { describe, expect, it } from 'vitest'
import {
  findIncompatibilities,
  nodeKey,
  resolveInstallOrder,
  type DependencyNode
} from '@main/services/mods/dependencyResolver'
import type { ModVersionOption } from '@shared/types'

function makeVersion(overrides: Partial<ModVersionOption> & { projectId: string }): ModVersionOption {
  return {
    platform: 'modrinth',
    versionId: `${overrides.projectId}-v1`,
    versionNumber: '1.0.0',
    fileName: `${overrides.projectId}.jar`,
    downloadUrl: `https://example.invalid/${overrides.projectId}.jar`,
    sha1: null,
    gameVersions: ['1.21'],
    loaders: ['fabric'],
    dependencies: [],
    distributionAllowed: true,
    projectUrl: `https://modrinth.com/mod/${overrides.projectId}`,
    ...overrides
  }
}

describe('resolveInstallOrder', () => {
  it('installs a dependency before the mod that requires it', () => {
    const libNode: DependencyNode = { key: nodeKey('modrinth', 'fabric-api'), version: makeVersion({ projectId: 'fabric-api' }) }
    const modNode: DependencyNode = {
      key: nodeKey('modrinth', 'my-mod'),
      version: makeVersion({
        projectId: 'my-mod',
        dependencies: [{ platform: 'modrinth', projectId: 'fabric-api', versionId: null, dependencyType: 'required' }]
      })
    }
    const nodesByKey = new Map([
      [libNode.key, libNode],
      [modNode.key, modNode]
    ])

    const order = resolveInstallOrder(modNode, nodesByKey)
    expect(order.map((n) => n.key)).toEqual([libNode.key, modNode.key])
  })

  it('ignores optional and incompatible dependency refs when ordering', () => {
    const modNode: DependencyNode = {
      key: nodeKey('modrinth', 'solo-mod'),
      version: makeVersion({
        projectId: 'solo-mod',
        dependencies: [
          { platform: 'modrinth', projectId: 'some-optional', versionId: null, dependencyType: 'optional' },
          { platform: 'modrinth', projectId: 'some-enemy', versionId: null, dependencyType: 'incompatible' }
        ]
      })
    }
    const order = resolveInstallOrder(modNode, new Map([[modNode.key, modNode]]))
    expect(order.map((n) => n.key)).toEqual([modNode.key])
  })

  it('throws when a required dependency cannot be resolved from the provided node map', () => {
    const modNode: DependencyNode = {
      key: nodeKey('modrinth', 'broken-mod'),
      version: makeVersion({
        projectId: 'broken-mod',
        dependencies: [{ platform: 'modrinth', projectId: 'missing-lib', versionId: null, dependencyType: 'required' }]
      })
    }
    expect(() => resolveInstallOrder(modNode, new Map([[modNode.key, modNode]]))).toThrow(/missing-lib/)
  })

  it('throws on a circular dependency instead of looping forever', () => {
    const aKey = nodeKey('modrinth', 'mod-a')
    const bKey = nodeKey('modrinth', 'mod-b')
    const aNode: DependencyNode = {
      key: aKey,
      version: makeVersion({
        projectId: 'mod-a',
        dependencies: [{ platform: 'modrinth', projectId: 'mod-b', versionId: null, dependencyType: 'required' }]
      })
    }
    const bNode: DependencyNode = {
      key: bKey,
      version: makeVersion({
        projectId: 'mod-b',
        dependencies: [{ platform: 'modrinth', projectId: 'mod-a', versionId: null, dependencyType: 'required' }]
      })
    }
    const nodesByKey = new Map([
      [aKey, aNode],
      [bKey, bNode]
    ])
    expect(() => resolveInstallOrder(aNode, nodesByKey)).toThrow(/Zirkulär/)
  })
})

describe('findIncompatibilities', () => {
  it('reports a conflict when the target declares an already-installed mod incompatible', () => {
    const targetNode: DependencyNode = {
      key: nodeKey('modrinth', 'new-mod'),
      version: makeVersion({
        projectId: 'new-mod',
        dependencies: [{ platform: 'modrinth', projectId: 'old-mod', versionId: null, dependencyType: 'incompatible' }]
      })
    }
    const conflicts = findIncompatibilities(targetNode, [{ platform: 'modrinth', projectId: 'old-mod' }])
    expect(conflicts).toEqual([nodeKey('modrinth', 'old-mod')])
  })

  it('reports no conflicts when nothing incompatible is installed', () => {
    const targetNode: DependencyNode = {
      key: nodeKey('modrinth', 'friendly-mod'),
      version: makeVersion({ projectId: 'friendly-mod' })
    }
    expect(findIncompatibilities(targetNode, [{ platform: 'modrinth', projectId: 'other-mod' }])).toEqual([])
  })
})
