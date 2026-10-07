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
    const socketPath = findDiscordSocketPath()
    if (!socketPath) return

    await new Promise<void>((resolve) => {
      const socket = createConnection(socketPath)
      socket.once('connect', () => {
        this.socket = socket
        this.sendHandshake()
        this.connected = true
        resolve()
      })
      socket.once('error', () => {
        this.connected = false
        resolve()
      })
      socket.setTimeout(3000, () => {
        socket.destroy()
        resolve()
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

function findDiscordSocketPath(): string | null {
  if (process.platform === 'win32') {
    for (let i = 0; i < 10; i++) {
      const candidate = `\\\\.\\pipe\\discord-ipc-${i}`
      // Named pipes can't be probed with existsSync; the connect attempt itself is the probe.
      return candidate
    }
    return null
  }
  const base =
    process.env.XDG_RUNTIME_DIR ?? process.env.TMPDIR ?? process.env.TMP ?? process.env.TEMP ?? '/tmp'
  for (let i = 0; i < 10; i++) {
    const candidate = `${base}/discord-ipc-${i}`
    if (existsSync(candidate)) return candidate
  }
  return null
}
