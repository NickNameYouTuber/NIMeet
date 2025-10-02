import React, { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  isLocal: boolean;
  isCameraEnabled?: boolean;
  username?: string;
  isGuest?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({ 
  stream, 
  isLocal, 
  isCameraEnabled = true, 
  username,
  isGuest = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const displayName = isLocal ? 'Вы' : username || 'Участник';
  const hasVideo = stream && stream.getVideoTracks().length > 0 && isCameraEnabled;

  return (
    <div className="relative w-full h-full bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] group">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2a2a2a] rounded-full flex items-center justify-center">
            <span className="text-2xl sm:text-3xl text-gray-400 font-semibold">
              {displayName[0].toUpperCase()}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/80 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg">
        <span className="text-white text-xs sm:text-sm font-medium flex items-center gap-1.5">
          {!isCameraEnabled && (
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A3.001 3.001 0 0018 13V5a3 3 0 00-3-3H8.586L3.707 2.293zm5.586 5.586L13 11.586V5H9.293z" clipRule="evenodd" />
            </svg>
          )}
          {displayName}
          {isGuest && !isLocal && (
            <span className="text-gray-400 text-xs">(Гость)</span>
          )}
        </span>
      </div>

      {isLocal && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-blue-600 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-white text-xs font-semibold">
          ВЫ
        </div>
      )}
    </div>
  );
};

export default VideoTile;

