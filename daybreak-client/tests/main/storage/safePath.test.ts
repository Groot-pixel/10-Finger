import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { resolveWithinBase, PathTraversalError } from '@main/services/storage/safePath'

describe('resolveWithinBase', () => {
  const base = '/home/user/.daybreak/profiles/some-profile'

  it('joins a normal relative path onto the base directory', () => {
    expect(resolveWithinBase(base, 'mods/example.jar')).toBe(join(base, 'mods/example.jar'))
  })

  it('rejects a "../" traversal attempt (zip-slip)', () => {
    expect(() => resolveWithinBase(base, '../../etc/passwd')).toThrow(PathTraversalError)
  })

  it('rejects a traversal attempt hidden in the middle of the path', () => {
    expect(() => resolveWithinBase(base, 'mods/../../../etc/passwd')).toThrow(PathTraversalError)
  })

  it('rejects an absolute path used as the "relative" entry name', () => {
    expect(() => resolveWithinBase(base, '/etc/passwd')).toThrow(PathTraversalError)
  })

  it('allows a nested subdirectory that stays within the base', () => {
    expect(resolveWithinBase(base, 'config/sub/dir/file.txt')).toBe(join(base, 'config/sub/dir/file.txt'))
  })
})
