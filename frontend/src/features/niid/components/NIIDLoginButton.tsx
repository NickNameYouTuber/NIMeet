import React, { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { NIIDClient } from '../sdk/core/NIIDClient';
import { LoginButtonProps } from '../sdk/types';

export const NIIDLoginButton: React.FC<LoginButtonProps> = ({
    clientId,
    clientSecret,
    apiUrl,
    ssoUrl,
    redirectUri,
    scope,
    onSuccess,
    onError,
    className = '',
    children,
    variant = 'primary'
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<NIIDClient | null>(null);

    useEffect(() => {
        try {
            const niidClient = new NIIDClient({
                clientId,
                clientSecret,
                apiUrl,
                ssoUrl,
                redirectUri,
                scope
            });
            setClient(niidClient);
        } catch (e) {
            console.error("Failed to initialize NIID Client", e);
        }
    }, [clientId, clientSecret, apiUrl, ssoUrl, redirectUri, scope]);

    const handleClick = useCallback(() => {
        if (!client || isLoading) return;

        setError(null);
        setIsLoading(true);

        try {
            client.login(redirectUri, scope);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
            if (onError) {
                onError(err);
            }
        }
    }, [client, redirectUri, scope, isLoading, onError]);

    const baseStyles = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
        primary: "bg-[#1a73e8] hover:bg-[#1557b0] text-white border border-transparent shadow-sm",
        secondary: "bg-white/10 hover:bg-white/15 text-white border border-white/20",
        outline: "bg-transparent border border-white/20 text-white hover:bg-white/5"
    };

    return (
        <button
            type="button"
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            onClick={handleClick}
            disabled={isLoading || !client}
            aria-label="Sign in with NIID"
        >
            {isLoading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm">Loading...</span>
                </>
            ) : (
                <>
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">
                        {children || 'Войти через NIID'}
                    </span>
                </>
            )}
        </button>
    );
};
