import { secretVault } from '../storage/secretVault'

const refreshTokenKey = (accountId: string): string => `account:${accountId}:msRefreshToken`
const accessTokenKey = (accountId: string): string => `account:${accountId}:mcAccessToken`

export const tokenStore = {
  async saveMicrosoftRefreshToken(accountId: string, refreshToken: string): Promise<void> {
    await secretVault.set(refreshTokenKey(accountId), refreshToken)
  },
  async getMicrosoftRefreshToken(accountId: string): Promise<string | null> {
    return secretVault.get(refreshTokenKey(accountId))
  },
  async saveMinecraftAccessToken(accountId: string, accessToken: string): Promise<void> {
    await secretVault.set(accessTokenKey(accountId), accessToken)
  },
  async getMinecraftAccessToken(accountId: string): Promise<string | null> {
    return secretVault.get(accessTokenKey(accountId))
  },
  async deleteAccountSecrets(accountId: string): Promise<void> {
    await secretVault.delete(refreshTokenKey(accountId))
    await secretVault.delete(accessTokenKey(accountId))
  }
}
