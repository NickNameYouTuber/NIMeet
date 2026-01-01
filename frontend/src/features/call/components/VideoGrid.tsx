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
                    <div className="w-full aspect-video relative">
                        <VideoTile
                            participant={localParticipant}
                            isLocal={true}
                            isCameraEnabled={localParticipant.isCameraEnabled}
                            isMicEnabled={localParticipant.isMicrophoneEnabled}
                            isSpeaking={speakingParticipants.has(localParticipant.identity)}
                            isHandRaised={raisedHands.has(localParticipant.identity)}
                        />
                    </div>
                    <div className="w-full aspect-video relative">
                        <ShareLinkTile callId={callId} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-2 md:p-4 bg-background overflow-auto relative">
            <div className="max-md:grid max-md:grid-cols-4 max-md:grid-rows-2 max-md:gap-2 max-md:max-w-full max-md:h-full max-md:max-h-full md:flex md:flex-wrap md:gap-4 md:justify-start md:items-start md:w-full">
                {allParticipants.map((p) => (
                    <div key={p.identity} className="max-md:w-full max-md:h-full max-md:min-h-0 md:flex-shrink-0 md:aspect-video md:w-auto md:min-w-[300px] md:flex-1 md:max-w-[calc(50%-0.5rem)] lg:max-w-[calc(33.333%-0.667rem)] xl:max-w-[calc(25%-0.75rem)] relative">
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
