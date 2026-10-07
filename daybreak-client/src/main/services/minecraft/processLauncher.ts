import { spawn, type ChildProcess } from 'node:child_process'

export interface LaunchedProcess {
  profileId: string
  child: ChildProcess
  startedAt: number
}

export type OutputListener = (stream: 'stdout' | 'stderr', line: string) => void
export type ExitListener = (code: number | null, signal: string | null) => void

const running = new Map<string, LaunchedProcess>()

/**
 * Spawns Minecraft (or a loader installer) as an argv array - never through a shell - so no
 * argument (a profile name, a path with spaces, a custom JVM flag) can ever be interpreted as
 * shell syntax.
 */
export function spawnGameProcess(
  profileId: string,
  command: string,
  args: string[],
  cwd: string,
  onOutput: OutputListener,
  onExit: ExitListener
): LaunchedProcess {
  const child = spawn(command, args, {
    cwd,
    shell: false,
    windowsHide: false,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let stdoutBuffer = ''
  let stderrBuffer = ''

  child.stdout?.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString('utf-8')
    const lines = stdoutBuffer.split(/\r?\n/)
    stdoutBuffer = lines.pop() ?? ''
    for (const line of lines) onOutput('stdout', line)
  })

  child.stderr?.on('data', (chunk: Buffer) => {
    stderrBuffer += chunk.toString('utf-8')
    const lines = stderrBuffer.split(/\r?\n/)
    stderrBuffer = lines.pop() ?? ''
    for (const line of lines) onOutput('stderr', line)
  })

  child.on('error', (error) => {
    onOutput('stderr', `[Daybreak Client] Prozess konnte nicht gestartet werden: ${error.message}`)
    onExit(null, null)
  })

  child.on('exit', (code, signal) => {
    if (stdoutBuffer) onOutput('stdout', stdoutBuffer)
    if (stderrBuffer) onOutput('stderr', stderrBuffer)
    running.delete(profileId)
    onExit(code, signal)
  })

  const launched: LaunchedProcess = { profileId, child, startedAt: Date.now() }
  running.set(profileId, launched)
  return launched
}

export function isProfileRunning(profileId: string): boolean {
  return running.has(profileId)
}

export function stopProfile(profileId: string): boolean {
  const launched = running.get(profileId)
  if (!launched) return false
  launched.child.kill()
  return true
}

export function getRunningProcess(profileId: string): LaunchedProcess | null {
  return running.get(profileId) ?? null
}
