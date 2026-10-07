import { describe, expect, it } from 'vitest'
import { buildLaunchArguments } from '@main/services/minecraft/argumentBuilder'
import type { VersionJson } from '@main/services/minecraft/versionJsonTypes'

function baseVersionJson(overrides: Partial<VersionJson> = {}): VersionJson {
  return {
    id: '1.21',
    mainClass: 'net.minecraft.client.main.Main',
    assets: '1.21',
    arguments: {
      jvm: ['-Djava.library.path=${natives_directory}', '-cp', '${classpath}'],
      game: [
        '--username',
        '${auth_player_name}',
        '--version',
        '${version_name}',
        '--gameDir',
        '${game_directory}',
        '--uuid',
        '${auth_uuid}',
        '--accessToken',
        '${auth_access_token}'
      ]
    },
    ...overrides
  }
}

function baseOptions() {
  return {
    versionName: '1.21',
    gameDir: '/home/user/.daybreak/profiles/default',
    assetsDir: '/home/user/.daybreak/cache/assets',
    nativesDir: '/home/user/.daybreak/profiles/default/natives/1.21',
    classpath: ['/libs/a.jar', '/libs/b.jar'],
    classpathSeparator: ':' as const,
    javaPath: '/usr/bin/java',
    ramMb: 4096,
    extraJvmArgs: [],
    auth: {
      accessToken: 'token-123',
      uuid: 'uuid-123',
      username: 'Steve',
      xuid: 'xuid-123',
      clientId: 'client-123'
    },
    hostOs: 'linux' as const,
    hostArch: 'x64',
    launcherVersion: '0.1.0'
  }
}

describe('buildLaunchArguments', () => {
  it('substitutes placeholders in jvm and game arguments', () => {
    const result = buildLaunchArguments({ versionJson: baseVersionJson(), ...baseOptions() })

    expect(result.command).toBe('/usr/bin/java')
    expect(result.args).toContain('-Djava.library.path=/home/user/.daybreak/profiles/default/natives/1.21')
    expect(result.args).toContain('/libs/a.jar:/libs/b.jar')
    expect(result.args).toContain('net.minecraft.client.main.Main')
    expect(result.args).toContain('Steve')
    expect(result.args).toContain('uuid-123')
    expect(result.args).toContain('token-123')
  })

  it('sets heap size flags from ramMb, capping -Xms at 1024', () => {
    const result = buildLaunchArguments({ versionJson: baseVersionJson(), ...baseOptions(), ramMb: 8192 })
    expect(result.args[0]).toBe('-Xms1024M')
    expect(result.args[1]).toBe('-Xmx8192M')
  })

  it('lets a smaller ramMb reduce -Xms below the 1024 cap', () => {
    const result = buildLaunchArguments({ versionJson: baseVersionJson(), ...baseOptions(), ramMb: 512 })
    expect(result.args[0]).toBe('-Xms512M')
    expect(result.args[1]).toBe('-Xmx512M')
  })

  it('places user-supplied extra JVM args after the version defaults so they can override them', () => {
    const result = buildLaunchArguments({
      versionJson: baseVersionJson(),
      ...baseOptions(),
      extraJvmArgs: ['-Xmx9999M', '-Dcustom.flag=1']
    })
    const mainClassIndex = result.args.indexOf('net.minecraft.client.main.Main')
    const customFlagIndex = result.args.indexOf('-Dcustom.flag=1')
    expect(customFlagIndex).toBeGreaterThan(-1)
    expect(customFlagIndex).toBeLessThan(mainClassIndex)
  })

  it('falls back to the default jvm/game templates when arguments.jvm is empty (old-format version json)', () => {
    const versionJson = baseVersionJson({ arguments: { jvm: [], game: [] } })
    const result = buildLaunchArguments({ versionJson, ...baseOptions() })
    expect(result.args).toContain('-cp')
    expect(result.args).toContain('--username')
  })

  it('parses the legacy whitespace-separated minecraftArguments string', () => {
    const versionJson = baseVersionJson({
      arguments: undefined,
      minecraftArguments: '--username ${auth_player_name} --uuid ${auth_uuid} --accessToken ${auth_access_token}'
    })
    const result = buildLaunchArguments({ versionJson, ...baseOptions() })
    expect(result.args).toContain('--username')
    expect(result.args).toContain('Steve')
  })

  it('filters rule-gated jvm arguments by host OS', () => {
    const versionJson = baseVersionJson({
      arguments: {
        jvm: [
          { rules: [{ action: 'allow', os: { name: 'windows' } }], value: '-Dos.windows=true' },
          { rules: [{ action: 'allow', os: { name: 'linux' } }], value: '-Dos.linux=true' }
        ],
        game: []
      }
    })
    const result = buildLaunchArguments({ versionJson, ...baseOptions(), hostOs: 'linux' })
    expect(result.args).not.toContain('-Dos.windows=true')
    expect(result.args).toContain('-Dos.linux=true')
  })

  it('throws a clear error when the version json has no mainClass', () => {
    const versionJson = baseVersionJson({ mainClass: undefined })
    expect(() => buildLaunchArguments({ versionJson, ...baseOptions() })).toThrow(/mainClass/)
  })
})
