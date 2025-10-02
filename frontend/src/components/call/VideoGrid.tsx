import React from 'react';
import VideoTile from './VideoTile';
import { Participant } from '../../types/call.types';
import { useAuth } from '../../hooks/useAuth';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isCameraEnabled: boolean;
  participants: Map<string, Participant>;
  isScreenSharing?: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  localStream, 
  remoteStreams, 
  isCameraEnabled,
  participants,
  isScreenSharing = false
}) => {
  const { user } = useAuth();
  const uniqueParticipants = new Map<string, { socketId: string; username: string; mediaState: { camera: boolean } }>();
  
  participants.forEach((participant) => {
    if (participant.userId !== user?.id && !uniqueParticipants.has(participant.userId)) {
      uniqueParticipants.set(participant.userId, {
        socketId: participant.socketId,
        username: participant.username,
        mediaState: participant.mediaState,
      });
    }
  });

  console.log('VideoGrid рендер:', {
    remoteStreamsSize: remoteStreams.size,
    participantsSize: participants.size,
    uniqueParticipantsSize: uniqueParticipants.size,
    participantIds: Array.from(participants.keys()),
    uniqueUserIds: Array.from(uniqueParticipants.keys()),
    isScreenSharing
  });
  
  const totalParticipants = 1 + uniqueParticipants.size;

  const getGridLayout = () => {
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (totalParticipants === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (totalParticipants === 4) return 'grid-cols-2 lg:grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-2 lg:grid-cols-3';
    if (totalParticipants <= 9) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  };

  if (isScreenSharing) {
    return (
      <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="w-40 h-28 sm:w-48 sm:h-36 md:w-56 md:h-40 flex-shrink-0">
          <VideoTile
            stream={localStream}
            isLocal={true}
            isCameraEnabled={isCameraEnabled}
          />
        </div>

        {Array.from(uniqueParticipants.entries()).map(([userId, participantData]) => {
          const stream = remoteStreams.get(participantData.socketId);
          const isGuest = userId.startsWith('guest-');
          return (
            <div key={userId} className="w-40 h-28 sm:w-48 sm:h-36 md:w-56 md:h-40 flex-shrink-0">
              <VideoTile
                stream={stream || null}
                isLocal={false}
                isCameraEnabled={participantData.mediaState.camera}
                username={participantData.username}
                isGuest={isGuest}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (totalParticipants === 1) {
    return (
      <div className="flex items-center justify-center h-full w-full p-2 sm:p-3 md:p-4">
        <div className="w-full max-w-2xl" style={{ aspectRatio: '4/3' }}>
          <VideoTile
            stream={localStream}
            isLocal={true}
            isCameraEnabled={isCameraEnabled}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid ${getGridLayout()} gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 h-full w-full`}>
      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
        <div className="absolute inset-0">
          <VideoTile
            stream={localStream}
            isLocal={true}
            isCameraEnabled={isCameraEnabled}
          />
        </div>
      </div>

      {Array.from(uniqueParticipants.entries()).map(([userId, participantData]) => {
        const stream = remoteStreams.get(participantData.socketId);
        const isGuest = userId.startsWith('guest-');
        return (
          <div key={userId} className="relative w-full" style={{ paddingBottom: '75%' }}>
            <div className="absolute inset-0">
              <VideoTile
                stream={stream || null}
                isLocal={false}
                isCameraEnabled={participantData.mediaState.camera}
                username={participantData.username}
                isGuest={isGuest}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VideoGrid;

