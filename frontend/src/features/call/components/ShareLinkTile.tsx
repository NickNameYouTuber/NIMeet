import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ShareLinkTileProps {
    callId: string;
}

export const ShareLinkTile: React.FC<ShareLinkTileProps> = ({ callId }) => {
    const [isCopied, setIsCopied] = useState(false);

    const meetingLink = `${window.location.origin}/call/${callId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(meetingLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    return (
        <div className="relative w-full h-full bg-card rounded-lg overflow-hidden shadow-sm border border-border flex flex-col">
            <div className="flex-1 flex flex-col justify-center p-6 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-white text-base font-medium">
                        Чтобы пригласить других участников, отправьте им ссылку на встречу
                    </h3>
                </div>

                <button
                    onClick={handleCopyLink}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        isCopied
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900 hover:bg-white/90'
                    }`}
                >
                    {isCopied ? (
                        <>
                            <Check className="w-5 h-5" />
                            <span>Ссылка скопирована</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-5 h-5" />
                            <span>Скопировать ссылку</span>
                        </>
                    )}
                </button>

                <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Встреча №</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm font-mono">
                                {callId}
                            </span>
                            <button
                                onClick={handleCopyLink}
                                className="text-white/60 hover:text-white transition-colors p-1"
                                title="Скопировать ID"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

