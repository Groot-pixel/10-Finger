import { createConnection, type Socket } from 'node:net'
import { existsSync } from 'node:fs'

const OP_HANDSHAKE = 0
const OP_FRAME = 1

/**
 * Minimal Discord IPC client (handshake + SET_ACTIVITY) implemented directly over the local
 * socket Discord's desktop app exposes, following Discord's own documented wire format
 * (4-byte opcode + 4-byte length header, both little-endian, followed by a JSON payload).
 * Avoids depending on the unmaintained discord-rpc / @discordjs/rpc packages.
 */
export class DiscordRpcClient {
  private socket: Socket | null = null
  private connected = false

  constructor(private readonly clientId: string) {}

  isConnected(): boolean {
    return this.connected
  }

  async connect(): Promise<void> {
    if (!this.clientId) return
    for (const candidate of findDiscordSocketCandidates()) {
      if (await this.tryConnect(candidate)) return
    }
  }

  private tryConnect(socketPath: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const socket = createConnection(socketPath)
      socket.once('connect', () => {
        this.socket = socket
        this.sendHandshake()
        this.connected = true
        resolve(true)
      })
      socket.once('error', () => {
        resolve(false)
      })
      socket.setTimeout(1500, () => {
        socket.destroy()
        resolve(false)
      })
    })
  }

  private writeFrame(opcode: number, payload: unknown): void {
    if (!this.socket) return
    const json = Buffer.from(JSON.stringify(payload), 'utf-8')
    const header = Buffer.alloc(8)
    header.writeInt32LE(opcode, 0)
    header.writeInt32LE(json.length, 4)
    this.socket.write(Buffer.concat([header, json]))
  }

  private sendHandshake(): void {
    this.writeFrame(OP_HANDSHAKE, { v: 1, client_id: this.clientId })
  }

  setActivity(details: string, state: string, startTimestamp: number): void {
    if (!this.connected) return
    this.writeFrame(OP_FRAME, {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: { details, state, timestamps: { start: startTimestamp } }
      },
      nonce: String(Date.now())
    })
  }

  disconnect(): void {
    this.socket?.destroy()
    this.socket = null
    this.connected = false
  }
}

/**
 * Lists every socket Discord might be listening on. On Windows a named pipe can't be probed
 * with existsSync, so every index is a candidate and connect() below tries them in order; on
 * Linux/macOS we can filter to sockets that actually exist first.
 */
function findDiscordSocketCandidates(): string[] {
  if (process.platform === 'win32') {
    return Array.from({ length: 10 }, (_, i) => `\\\\.\\pipe\\discord-ipc-${i}`)
  }
  const base =
    process.env.XDG_RUNTIME_DIR ?? process.env.TMPDIR ?? process.env.TMP ?? process.env.TEMP ?? '/tmp'
  return Array.from({ length: 10 }, (_, i) => `${base}/discord-ipc-${i}`).filter((candidate) =>
    existsSync(candidate)
  )
}
