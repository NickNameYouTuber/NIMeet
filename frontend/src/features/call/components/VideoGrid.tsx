import React from 'react';
import { Participant } from 'livekit-client';
import { VideoTile } from './VideoTile';
import { ShareLinkTile } from './ShareLinkTile';
import { cn } from '@/lib/utils';

interface VideoGridProps {
    participants: Participant[];
    localParticipant: Participant;
    speakingParticipants: Set<string>;
    raisedHands: Set<string>;
    isScreenSharing: boolean;
    callId?: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
    participants,
    localParticipant,
    speakingParticipants,
    raisedHands,
    isScreenSharing,
    callId,
}) => {
    const allParticipants = [localParticipant, ...participants];
    const isAlone = allParticipants.length === 1;

    // Logic for grid vs filmstrip
    if (isScreenSharing) {
        // Filmstrip mode (horizontal list)
        return (
            <div className="w-full h-full flex items-center justify-center p-4 bg-background overflow-hidden relative">
                <div className="flex gap-4 overflow-x-auto w-full h-full items-center px-4 scrollbar-hide">
                    {allParticipants.map((p) => (
                        <div key={p.identity} className="flex-shrink-0 w-48 h-36 relative">
                            <VideoTile
                                participant={p}
                                isLocal={p.isLocal}
                                isCameraEnabled={p.isCameraEnabled}
                                isMicEnabled={p.isMicrophoneEnabled}
                                isSpeaking={speakingParticipants.has(p.identity)}
                                isHandRaised={raisedHands.has(p.identity)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const gridClassName = cn(
        "grid gap-4 w-full h-full p-4 auto-rows-fr",
        isAlone && callId && "grid-cols-2",
        !isAlone && allParticipants.length === 2 && "grid-cols-2",
        !isAlone && allParticipants.length > 2 && allParticipants.length <= 4 && "grid-cols-2 sm:grid-cols-2",
        !isAlone && allParticipants.length > 4 && allParticipants.length <= 9 && "grid-cols-2 sm:grid-cols-3",
        !isAlone && allParticipants.length > 9 && "grid-cols-3 sm:grid-cols-4"
    );

    return (
        <div className="w-full h-full overflow-y-auto overflow-x-hidden flex items-center justify-center">
            <div className={cn(gridClassName, "max-w-7xl max-h-full aspect-video")}>
                {allParticipants.map((p) => (
                    <div key={p.identity} className="w-full h-full min-h-0">
                        <VideoTile
                            participant={p}
                            isLocal={p.isLocal}
                            isCameraEnabled={p.isCameraEnabled}
                            isMicEnabled={p.isMicrophoneEnabled}
                            isSpeaking={speakingParticipants.has(p.identity)}
                            isHandRaised={raisedHands.has(p.identity)}
                        />
                    </div>
                ))}
                {isAlone && callId && (
                    <div className="w-full h-full min-h-0">
                        <ShareLinkTile callId={callId} />
                    </div>
                )}
            </div>
        </div>
    );
};
