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
    const totalCount = allParticipants.length + (isAlone && callId ? 1 : 0);

    if (isAlone && callId) {
        return (
            <div className="w-full h-full flex items-center justify-center p-2 md:p-4 bg-background overflow-hidden relative">
                <div className="w-full max-w-2xl flex flex-col gap-2 md:gap-4 h-full justify-center">
                    <div className="w-full h-32 md:h-48 relative">
                        <VideoTile
                            participant={localParticipant}
                            isLocal={true}
                            isCameraEnabled={localParticipant.isCameraEnabled}
                            isMicEnabled={localParticipant.isMicrophoneEnabled}
                            isSpeaking={speakingParticipants.has(localParticipant.identity)}
                            isHandRaised={raisedHands.has(localParticipant.identity)}
                        />
                    </div>
                    <div className="w-full h-32 md:h-48 relative">
                        <ShareLinkTile callId={callId} />
                    </div>
                </div>
            </div>
        );
    }

    const getGridClasses = () => {
        if (totalCount <= 4) {
            return cn(
                "grid gap-2 md:gap-4 w-full max-w-4xl h-full",
                totalCount === 1 && "grid-cols-1",
                totalCount === 2 && "grid-cols-2",
                totalCount === 3 && "grid-cols-3",
                totalCount === 4 && "grid-cols-4"
            );
        } else {
            return "grid grid-cols-4 grid-rows-2 gap-2 md:gap-4 w-full max-w-4xl h-full";
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-2 md:p-4 bg-background overflow-hidden relative">
            <div className={getGridClasses()}>
                {allParticipants.map((p) => (
                    <div key={p.identity} className="w-full h-full min-h-0 relative">
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
};
