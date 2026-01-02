import axios, { AxiosInstance } from 'axios';
import { NIIDConfig, UserInfo } from '../types';
import { validateConfig } from '../utils/validation';
import { TokenManager } from './TokenManager';
import { OAuthFlow } from './OAuthFlow';

export class NIIDClient {
    private config: Required<NIIDConfig>;
    private tokenManager: TokenManager;
    private oauthFlow: OAuthFlow;
    private apiClient: AxiosInstance;

    constructor(config: NIIDConfig) {
        validateConfig(config);

        this.config = {
            clientId: config.clientId,
            clientSecret: config.clientSecret || '',
            apiUrl: config.apiUrl || 'http://localhost:11700',
            ssoUrl: config.ssoUrl || 'http://localhost:11706',
            redirectUri: config.redirectUri || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''),
            scope: config.scope || 'profile email',
            storageKey: config.storageKey || 'niid'
        };

        this.tokenManager = new TokenManager(this.config.storageKey);
        this.oauthFlow = new OAuthFlow(this.config);

        this.apiClient = axios.create({
            baseURL: this.config.apiUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.setupTokenRefresh();
    }

    login(redirectUri?: string, scope?: string): void {
        if (redirectUri) {
            this.config.redirectUri = redirectUri;
        }
        if (scope) {
            this.config.scope = scope;
        }
        this.oauthFlow.initiateLogin();
    }

    async handleCallback(): Promise<UserInfo | null> {
        if (typeof window === 'undefined') {
            throw new Error('handleCallback can only be called in browser environment');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
            return null;
        }

        try {
            const tokenResponse = await this.oauthFlow.exchangeCodeForToken(code, state || undefined);
            this.tokenManager.setTokens(tokenResponse);

            const user = await this.getUserInfo();

            if (user) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }

            return user;
        } catch (error: any) {
            throw new Error(`Failed to handle OAuth callback: ${error.message}`);
        }
    }

    async getUserInfo(): Promise<UserInfo> {
        const accessToken = this.tokenManager.getAccessToken();

        if (!accessToken) {
            throw new Error('No access token available. Please login first.');
        }

        if (!this.tokenManager.isAccessTokenValid()) {
            const refreshToken = this.tokenManager.getRefreshToken();
            if (refreshToken) {
                try {
                    const tokenResponse = await this.oauthFlow.refreshAccessToken(refreshToken);
                    this.tokenManager.setTokens(tokenResponse);
                } catch (error) {
                    this.logout();
                    throw new Error('Access token expired and refresh failed. Please login again.');
                }
            } else {
                this.logout();
                throw new Error('Access token expired. Please login again.');
            }
        }

        const currentToken = this.tokenManager.getAccessToken();
        if (!currentToken) {
            throw new Error('No access token available');
        }

        try {
            const response = await this.apiClient.get<UserInfo>('/oauth/userinfo', {
                headers: {
                    Authorization: `Bearer ${currentToken}`
                }
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                const refreshToken = this.tokenManager.getRefreshToken();
                if (refreshToken) {
                    try {
                        const tokenResponse = await this.oauthFlow.refreshAccessToken(refreshToken);
                        this.tokenManager.setTokens(tokenResponse);
                        const newToken = this.tokenManager.getAccessToken();
                        if (newToken) {
                            const retryResponse = await this.apiClient.get<UserInfo>('/oauth/userinfo', {
                                headers: {
                                    Authorization: `Bearer ${newToken}`
                                }
                            });
                            return retryResponse.data;
                        }
                    } catch (refreshError) {
                        this.logout();
                        throw new Error('Failed to refresh token. Please login again.');
                    }
                }
                this.logout();
                throw new Error('Unauthorized. Please login again.');
            }
            throw new Error(`Failed to get user info: ${error.message}`);
        }
    }

    async refreshToken(): Promise<void> {
        const refreshToken = this.tokenManager.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const tokenResponse = await this.oauthFlow.refreshAccessToken(refreshToken);
            this.tokenManager.setTokens(tokenResponse);
        } catch (error: any) {
            this.logout();
            throw new Error(`Failed to refresh token: ${error.message}`);
        }
    }

    logout(): void {
        this.tokenManager.clearTokens();
    }

    isAuthenticated(): boolean {
        return this.tokenManager.isAccessTokenValid();
    }

    getAccessToken(): string | null {
        return this.tokenManager.getAccessToken();
    }

    private setupTokenRefresh(): void {
        const accessToken = this.tokenManager.getAccessToken();
        if (accessToken && this.tokenManager.isAccessTokenValid()) {
            this.tokenManager.scheduleTokenRefresh(accessToken, () => {
                this.refreshToken().catch(error => {
                    console.error('[NIID SDK] Failed to refresh token automatically:', error);
                });
            });
        }
    }
}
