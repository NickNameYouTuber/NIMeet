import { NIIDConfig } from '../types';

export function validateConfig(config: NIIDConfig): void {
    if (!config.clientId || typeof config.clientId !== 'string') {
        throw new Error('clientId is required and must be a string');
    }

    if (config.clientSecret && typeof config.clientSecret !== 'string') {
        throw new Error('clientSecret must be a string');
    }

    if (config.apiUrl && typeof config.apiUrl !== 'string') {
        throw new Error('apiUrl must be a string');
    }

    if (config.ssoUrl && typeof config.ssoUrl !== 'string') {
        throw new Error('ssoUrl must be a string');
    }

    if (config.redirectUri && typeof config.redirectUri !== 'string') {
        throw new Error('redirectUri must be a string');
    }

    if (config.scope && typeof config.scope !== 'string') {
        throw new Error('scope must be a string');
    }
}

export function generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function buildAuthorizationUrl(
    ssoUrl: string,
    clientId: string,
    redirectUri: string,
    scope: string = 'profile email',
    state?: string
): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scope
    });

    if (state) {
        params.append('state', state);
    }

    return `${ssoUrl}/?${params.toString()}`;
}
