import axios, { AxiosInstance } from 'axios';
import { NIIDConfig, TokenResponse } from '../types';
import { generateState, buildAuthorizationUrl } from '../utils/validation';

export class OAuthFlow {
    private config: Required<NIIDConfig>;
    private apiClient: AxiosInstance;
    private stateStorageKey: string;

    constructor(config: NIIDConfig) {
        this.config = {
            clientId: config.clientId,
            clientSecret: config.clientSecret || '',
            apiUrl: config.apiUrl || 'http://localhost:11700',
            ssoUrl: config.ssoUrl || 'http://localhost:11706',
            redirectUri: config.redirectUri || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''),
            scope: config.scope || 'profile email',
            storageKey: config.storageKey || 'niid'
        };

        this.stateStorageKey = `${this.config.storageKey}_oauth_state_${this.config.clientId}`;

        this.apiClient = axios.create({
            baseURL: this.config.apiUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    initiateLogin(): void {
        const state = generateState();
        this.saveState(state);

        const authUrl = buildAuthorizationUrl(
            this.config.ssoUrl,
            this.config.clientId,
            this.config.redirectUri,
            this.config.scope,
            state
        );

        window.location.href = authUrl;
    }

    async exchangeCodeForToken(code: string, state?: string): Promise<TokenResponse> {
        if (state) {
            const savedState = this.getState();
            if (savedState) {
                if (savedState !== state) {
                    throw new Error('Invalid state parameter. Possible CSRF attack.');
                }
                this.clearState();
            }
        }

        const tokenData: any = {
            grant_type: 'authorization_code',
            code: code,
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri
        };

        if (this.config.clientSecret) {
            tokenData.client_secret = this.config.clientSecret;
        }

        try {
            const response = await this.apiClient.post<TokenResponse>('/oauth/token', tokenData);
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to exchange authorization code';
            throw new Error(errorMessage);
        }
    }

    async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
        const tokenData: any = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.config.clientId
        };

        if (this.config.clientSecret) {
            tokenData.client_secret = this.config.clientSecret;
        }

        try {
            const response = await this.apiClient.post<TokenResponse>('/oauth/token', tokenData);
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to refresh access token';
            throw new Error(errorMessage);
        }
    }

    private saveState(state: string): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(this.stateStorageKey, state);
            } catch (error) {
                console.warn('[NIID SDK] Failed to save state to localStorage:', error);
            }
        }
    }

    private getState(): string | null {
        if (typeof window !== 'undefined') {
            try {
                return localStorage.getItem(this.stateStorageKey);
            } catch (error) {
                console.warn('[NIID SDK] Failed to read state from localStorage:', error);
                return null;
            }
        }
        return null;
    }

    private clearState(): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(this.stateStorageKey);
            } catch (error) {
                console.warn('[NIID SDK] Failed to clear state from localStorage:', error);
            }
        }
    }
}
