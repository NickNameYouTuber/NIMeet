import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, Hand, PhoneOff, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
    isScreenSharing: boolean;
    isChatOpen: boolean;
    isHandRaised: boolean;
    isYouTubeActive: boolean;
    onToggleCamera: () => void;
    onToggleMicrophone: () => void;
    onToggleScreenShare: () => void;
    onToggleChat: () => void;
    onToggleRaiseHand: () => void;
    onToggleYouTube: () => void;
    onLeave: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    isCameraEnabled,
    isMicrophoneEnabled,
    isScreenSharing,
    isChatOpen,
    isHandRaised,
    isYouTubeActive,
    onToggleCamera,
    onToggleMicrophone,
    onToggleScreenShare,
    onToggleChat,
    onToggleRaiseHand,
    onToggleYouTube,
    onLeave,
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 py-3">
            <div className="max-w-7xl mx-auto px-4 flex justify-center gap-4">
                <button
                    onClick={onToggleMicrophone}
                    className={cn(
                        "p-3 rounded-full transition-colors",
                        isMicrophoneEnabled ? "bg-secondary hover:bg-secondary/80 text-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    )}
                    title={isMicrophoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                    {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                    onClick={onToggleCamera}
                    className={cn(
                        "p-3 rounded-full transition-colors",
                        isCameraEnabled ? "bg-secondary hover:bg-secondary/80 text-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    )}
                    title={isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                    {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                    onClick={onToggleScreenShare}
                    className={cn(
                        "p-3 rounded-full transition-colors",
                        isScreenSharing ? "bg-green-600 hover:bg-green-700 text-white" : "bg-secondary hover:bg-secondary/80 text-foreground"
                    )}
                    title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                >
                    {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>

                <button
                    onClick={onToggleChat}
                    className={cn(
                        "p-3 rounded-full transition-colors",
                        isChatOpen ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"
                    )}
                    title="Chat"
                >
                    <MessageSquare className="w-5 h-5" />
                </button>

                <button
                    onClick={onToggleRaiseHand}
                    className={cn(
                        "p-3 rounded-full transition-colors",
                        isHandRaised ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-secondary hover:bg-secondary/80 text-foreground"
                    )}
                    title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                >
                    <Hand className="w-5 h-5" />
                </button>

                <button
                    onClick={onToggleYouTube}
                    className={cn(
                        "p-3 rounded-full transition-colors",
                        isYouTubeActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-secondary hover:bg-secondary/80 text-foreground"
                    )}
                    title="Watch Together"
                >
                    <Youtube className="w-5 h-5" />
                </button>

                <div className="w-px h-10 bg-border mx-2" />

                <button
                    onClick={onLeave}
                    className="p-3 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    title="Leave Call"
                >
                    <PhoneOff className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
