import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';
import { Participant, Track, TrackPublication } from 'livekit-client';
import { useParticipantTracks } from '@livekit/components-react';
import { VideoTileBorder } from './VideoTileBorder';

interface VideoTileProps {
    participant: Participant;
    isLocal: boolean;
    isCameraEnabled: boolean;
    isMicEnabled: boolean;
    isSpeaking: boolean;
    isHandRaised: boolean;
}

export const VideoTile: React.FC<VideoTileProps> = ({
    participant,
    isLocal,
    isCameraEnabled,
    isMicEnabled,
    isSpeaking,
    isHandRaised,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Use LiveKit hook to properly subscribe to track changes
    const tracks = useParticipantTracks([Track.Source.Camera, Track.Source.Microphone], participant.identity);

    const cameraTrack = tracks.find(t => t.source === Track.Source.Camera);
    const hasVideo = !!cameraTrack?.publication?.track && isCameraEnabled;

    useEffect(() => {
        if (!videoRef.current) return;

        if (!isCameraEnabled) {
            videoRef.current.srcObject = null;
            return;
        }

        const videoTrack = cameraTrack?.publication?.track;
        if (videoTrack) {
            videoTrack.attach(videoRef.current);
            return () => {
                videoTrack.detach(videoRef.current!);
            };
        } else {
            videoRef.current.srcObject = null;
        }
    }, [cameraTrack, isCameraEnabled]);

    const displayName = participant.name || participant.identity;

    return (
        <div className="relative w-full h-full bg-card rounded-lg overflow-hidden group shadow-sm border border-border">
            {hasVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                />
            ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl text-muted-foreground font-semibold">
                            {displayName?.[0]?.toUpperCase() || '?'}
                        </span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/80 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg">
                <span className="text-white text-xs sm:text-sm font-medium flex items-center gap-1.5">
                    {!hasVideo && (
                        <VideoOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                    )}
                    {!isMicEnabled && (
                        <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                    )}
                    {displayName}
                    {isLocal && <span className="text-gray-400 text-xs">(You)</span>}
                </span>
            </div>

            <VideoTileBorder isSpeaking={isSpeaking} isHandRaised={isHandRaised} />
        </div>
    );
};
