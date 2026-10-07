import {
  MICROSOFT_OAUTH_DEVICE_CODE_URL,
  MICROSOFT_OAUTH_TOKEN_URL
} from '@shared/constants'
import { fetchJson, HttpError } from '../network/httpClient'

const SCOPE = 'XboxLive.signin offline_access'

export class MicrosoftAuthCancelledError extends Error {
  constructor() {
    super('Anmeldung wurde abgebrochen')
    this.name = 'MicrosoftAuthCancelledError'
  }
}

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export interface MicrosoftTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

function formBody(params: Record<string, string>): string {
  return new URLSearchParams(params).toString()
}

export function resolveClientId(override: string | null): string {
  const clientId = override?.trim() || process.env.DAYBREAK_MICROSOFT_CLIENT_ID?.trim()
  if (!clientId) {
    throw new Error(
      'Keine Microsoft-Azure-Client-ID konfiguriert. Setze die Umgebungsvariable DAYBREAK_MICROSOFT_CLIENT_ID oder trage sie in den Einstellungen ein, um dich anzumelden.'
    )
  }
  return clientId
}

export async function requestDeviceCode(clientId: string): Promise<DeviceCodeResponse> {
  return fetchJson<DeviceCodeResponse>(MICROSOFT_OAUTH_DEVICE_CODE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({ client_id: clientId, scope: SCOPE })
  })
}

interface TokenErrorResponse {
  error: string
}

/** Polls the token endpoint at the server-specified interval until the user approves, denies, or the code expires. */
export async function pollForToken(
  clientId: string,
  deviceCode: DeviceCodeResponse,
  signal: AbortSignal
): Promise<MicrosoftTokenResponse> {
  const deadline = Date.now() + deviceCode.expires_in * 1000
  let intervalMs = Math.max(deviceCode.interval, 5) * 1000

  while (Date.now() < deadline) {
    if (signal.aborted) throw new MicrosoftAuthCancelledError()
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    if (signal.aborted) throw new MicrosoftAuthCancelledError()

    const response = await fetch(MICROSOFT_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: clientId,
        device_code: deviceCode.device_code
      })
    })

    if (response.ok) {
      return (await response.json()) as MicrosoftTokenResponse
    }

    const errorBody = (await response.json().catch(() => ({ error: 'unknown_error' }))) as TokenErrorResponse
    if (errorBody.error === 'authorization_pending') continue
    if (errorBody.error === 'slow_down') {
      intervalMs += 5000
      continue
    }
    if (errorBody.error === 'expired_token') {
      throw new Error('Der Anmeldecode ist abgelaufen. Bitte starte die Anmeldung erneut.')
    }
    if (errorBody.error === 'authorization_declined') {
      throw new Error('Die Anmeldung wurde abgelehnt.')
    }
    throw new HttpError(`Microsoft-Anmeldung fehlgeschlagen: ${errorBody.error}`)
  }
  throw new Error('Der Anmeldecode ist abgelaufen. Bitte starte die Anmeldung erneut.')
}

export async function refreshMicrosoftToken(
  clientId: string,
  refreshToken: string
): Promise<MicrosoftTokenResponse> {
  return fetchJson<MicrosoftTokenResponse>(MICROSOFT_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
      scope: SCOPE
    })
  })
}
