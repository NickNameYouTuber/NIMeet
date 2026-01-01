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
            <div className="flex-1 flex flex-col justify-center p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="space-y-2">
                    <h3 className="text-white text-sm md:text-base font-medium">
                        Чтобы пригласить других участников, отправьте им ссылку на встречу
                    </h3>
                </div>

                <button
                    onClick={handleCopyLink}
                    className={`w-full py-2.5 md:py-3 px-3 md:px-4 rounded-lg font-semibold text-sm md:text-base transition-all flex items-center justify-center gap-2 ${
                        isCopied
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900 hover:bg-white/90'
                    }`}
                >
                    {isCopied ? (
                        <>
                            <Check className="w-4 h-4 md:w-5 md:h-5" />
                            <span>Ссылка скопирована</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 md:w-5 md:h-5" />
                            <span>Скопировать ссылку</span>
                        </>
                    )}
                </button>

                <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-white/60 text-xs md:text-sm">Встреча №</span>
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-white font-medium text-xs md:text-sm font-mono truncate max-w-[120px] md:max-w-none">
                                {callId}
                            </span>
                            <button
                                onClick={handleCopyLink}
                                className="text-white/60 hover:text-white transition-colors p-1 flex-shrink-0"
                                title="Скопировать ID"
                            >
                                <Copy className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

