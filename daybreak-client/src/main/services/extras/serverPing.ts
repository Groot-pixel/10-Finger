import { connect } from 'node:net'
import type { ServerPingResult } from '@shared/types'

function writeVarInt(value: number): Buffer {
  const bytes: number[] = []
  let v = value
  do {
    let temp = v & 0b01111111
    v >>>= 7
    if (v !== 0) temp |= 0b10000000
    bytes.push(temp)
  } while (v !== 0)
  return Buffer.from(bytes)
}

function writeString(value: string): Buffer {
  const strBuffer = Buffer.from(value, 'utf-8')
  return Buffer.concat([writeVarInt(strBuffer.length), strBuffer])
}

function buildPacket(packetId: number, ...fields: Buffer[]): Buffer {
  const body = Buffer.concat([writeVarInt(packetId), ...fields])
  return Buffer.concat([writeVarInt(body.length), body])
}

function readVarInt(buffer: Buffer, offset: number): { value: number; next: number } {
  let result = 0
  let shift = 0
  let pos = offset
  for (;;) {
    const byte = buffer[pos]
    if (byte === undefined) throw new Error('Unerwartetes Ende der Antwort')
    pos += 1
    result |= (byte & 0b01111111) << shift
    if ((byte & 0b10000000) === 0) break
    shift += 7
  }
  return { value: result, next: pos }
}

interface MotdPlayers {
  online: number
  max: number
}
interface MotdDescription {
  text?: string
}
interface ServerListPingResponse {
  version: { name: string }
  players: MotdPlayers
  description: MotdDescription | string
}

/**
 * Implements the Minecraft Server List Ping handshake directly over TCP (the same lightweight
 * protocol every server browser uses) instead of pulling in a dependency for it.
 */
export async function pingJavaServer(address: string, timeoutMs = 5000): Promise<ServerPingResult> {
  const [hostPart, portPart] = address.split(':')
  const host = hostPart ?? address
  const port = portPart ? Number(portPart) : 25565

  return new Promise((resolve) => {
    const start = Date.now()
    const socket = connect({ host, port, timeout: timeoutMs })
    let responseBuffer = Buffer.alloc(0)
    let settled = false

    const finish = (result: ServerPingResult): void => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.on('timeout', () => {
      finish({ online: false, playersOnline: null, playersMax: null, motd: null, versionName: null, latencyMs: null, error: 'Zeitüberschreitung' })
    })
    socket.on('error', (error) => {
      finish({ online: false, playersOnline: null, playersMax: null, motd: null, versionName: null, latencyMs: null, error: error.message })
    })

    socket.on('connect', () => {
      // Protocol version is informational for a status ping - servers reply with their own
      // version regardless, so any recent constant works here.
      const PROTOCOL_VERSION = 767
      const handshake = buildPacket(
        0x00,
        writeVarInt(PROTOCOL_VERSION),
        writeString(host),
        Buffer.from([(port >> 8) & 0xff, port & 0xff]),
        writeVarInt(1)
      )
      const statusRequest = buildPacket(0x00)
      socket.write(Buffer.concat([handshake, statusRequest]))
    })

    socket.on('data', (chunk) => {
      responseBuffer = Buffer.concat([responseBuffer, chunk])
      try {
        const { value: packetLength, next: afterLength } = readVarInt(responseBuffer, 0)
        if (responseBuffer.length < afterLength + packetLength) return // wait for more data
        const { value: _packetId, next: afterId } = readVarInt(responseBuffer, afterLength)
        const { value: jsonLength, next: afterJsonLength } = readVarInt(responseBuffer, afterId)
        const jsonStart = afterJsonLength
        if (responseBuffer.length < jsonStart + jsonLength) return
        const json = responseBuffer.subarray(jsonStart, jsonStart + jsonLength).toString('utf-8')
        const parsed = JSON.parse(json) as ServerListPingResponse
        const motd = typeof parsed.description === 'string' ? parsed.description : parsed.description.text ?? null
        finish({
          online: true,
          playersOnline: parsed.players.online,
          playersMax: parsed.players.max,
          motd,
          versionName: parsed.version.name,
          latencyMs: Date.now() - start,
          error: null
        })
      } catch {
        // Not enough data yet to parse a full packet - keep buffering until timeout/error.
      }
    })
  })
}
