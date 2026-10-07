import { XBOX_LIVE_AUTH_URL, XSTS_AUTH_URL } from '@shared/constants'
import { fetchWithRetry, HttpError } from '../network/httpClient'

export interface XboxLiveToken {
  token: string
  userHash: string
}

interface XboxAuthResponse {
  Token: string
  DisplayClaims: { xui: Array<{ uhs: string }> }
}

export async function authenticateWithXboxLive(microsoftAccessToken: string): Promise<XboxLiveToken> {
  const response = await fetchWithRetry(XBOX_LIVE_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${microsoftAccessToken}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    })
  })
  const data = (await response.json()) as XboxAuthResponse
  const userHash = data.DisplayClaims.xui[0]?.uhs
  if (!userHash) {
    throw new HttpError('Xbox Live hat keinen gültigen Nutzer-Hash zurückgegeben')
  }
  return { token: data.Token, userHash }
}

export interface XstsToken {
  token: string
  userHash: string
  xuid: string
}

interface XstsAuthResponse {
  Token: string
  DisplayClaims: { xui: Array<{ uhs: string; xid?: string }> }
}

export async function authenticateWithXsts(xboxLiveToken: XboxLiveToken): Promise<XstsToken> {
  const response = await fetchWithRetry(XSTS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Properties: { SandboxId: 'RETAIL', UserTokens: [xboxLiveToken.token] },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    })
  })

  if (response.status === 401) {
    throw new HttpError(
      'Xbox-Konto kann nicht verwendet werden (z. B. Kindersicherung aktiv oder Konto in einer nicht unterstützten Region).'
    )
  }

  const data = (await response.json()) as XstsAuthResponse
  const claim = data.DisplayClaims.xui[0]
  if (!claim) {
    throw new HttpError('XSTS hat keine gültigen Nutzerdaten zurückgegeben')
  }
  return { token: data.Token, userHash: claim.uhs, xuid: claim.xid ?? '' }
}
