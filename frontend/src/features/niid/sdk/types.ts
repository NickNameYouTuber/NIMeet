export interface NIIDConfig {
    clientId: string;
    clientSecret?: string;
    apiUrl?: string;
    ssoUrl?: string;
    redirectUri?: string;
    scope?: string;
    storageKey?: string;
}

export interface UserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
    [key: string]: any;
}

export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export interface JWTPayload {
    iss?: string;
    sub?: string;
    aud?: string[] | string;
    exp: number;
    nbf?: number;
    iat?: number;
    jti?: string;
    [key: string]: any;
}

export interface LoginButtonProps {
    clientId: string;
    clientSecret?: string;
    apiUrl?: string;
    ssoUrl?: string;
    redirectUri: string;
    scope?: string;
    onSuccess?: (user: UserInfo) => void;
    onError?: (error: Error) => void;
    className?: string;
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
}
