import { jwtDecode } from '../utils/jwt';
import { StorageManager } from '../utils/storage';
import { JWTPayload, TokenResponse } from '../types';

export class TokenManager {
  private storage: StorageManager;
  private accessTokenKey: string;
  private refreshTokenKey: string;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(storageKey: string = 'niid') {
    this.storage = new StorageManager(storageKey);
    this.accessTokenKey = 'access_token';
    this.refreshTokenKey = 'refresh_token';
  }

  setTokens(tokenResponse: TokenResponse): void {
    this.storage.set(this.accessTokenKey, tokenResponse.access_token);
    if (tokenResponse.refresh_token) {
      this.storage.set(this.refreshTokenKey, tokenResponse.refresh_token);
    }
    this.scheduleTokenRefresh(tokenResponse.access_token);
  }

  getAccessToken(): string | null {
    return this.storage.get(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return this.storage.get(this.refreshTokenKey);
  }

  isTokenValid(token: string | null): boolean {
    if (!token) return false;

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp > now;
    } catch (error) {
      return false;
    }
  }

  isAccessTokenValid(): boolean {
    const token = this.getAccessToken();
    return this.isTokenValid(token);
  }

  getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.exp * 1000;
    } catch (error) {
      return null;
    }
  }

  scheduleTokenRefresh(accessToken: string, onRefresh?: () => void): void {
    this.clearRefreshTimer();

    const expiration = this.getTokenExpiration(accessToken);
    if (!expiration) return;

    const now = Date.now();
    const timeUntilExpiry = expiration - now;
    const refreshTime = timeUntilExpiry - (2 * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        if (onRefresh) {
          onRefresh();
        }
      }, refreshTime);
    }
  }

  clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  clearTokens(): void {
    this.storage.remove(this.accessTokenKey);
    this.storage.remove(this.refreshTokenKey);
    this.clearRefreshTimer();
  }
}
