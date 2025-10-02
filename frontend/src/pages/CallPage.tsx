import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoGrid from '../components/call/VideoGrid';
import ControlPanel from '../components/call/ControlPanel';
import PreCallSetup from '../components/call/PreCallSetup';

const CallPage: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const [hasJoined, setHasJoined] = useState(false);
  const [preCallSettings, setPreCallSettings] = useState<{ 
    cameraEnabled: boolean; 
    microphoneEnabled: boolean; 
    guestName?: string 
  }>({ cameraEnabled: true, microphoneEnabled: true });
  
  const {
    localStream,
    localScreenStream,
    remoteStreams,
    remoteScreenStreams,
    isCameraEnabled,
    isMicrophoneEnabled,
    isScreenSharing,
    participants,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    initializeMedia,
    cleanup,
  } = useWebRTC(callId || '', preCallSettings.guestName);

  useEffect(() => {
    if (hasJoined) {
      initializeMedia();
    }
    return () => {
      if (hasJoined) {
        cleanup();
      }
    };
  }, [hasJoined, initializeMedia, cleanup]);

  const handleJoinCall = (options: { cameraEnabled: boolean; microphoneEnabled: boolean; guestName?: string }) => {
    setPreCallSettings(options);
    setHasJoined(true);
  };

  if (!hasJoined) {
    return <PreCallSetup roomId={callId || ''} onJoin={handleJoinCall} />;
  }

  const hasScreenShare = !!(localScreenStream || remoteScreenStreams.size > 0);
  const screenToShow = localScreenStream || (remoteScreenStreams.size > 0 ? Array.from(remoteScreenStreams.values())[0] : null);

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {hasScreenShare && screenToShow && (
          <div className="w-full bg-black flex-shrink-0 border-b border-[#2a2a2a]" style={{ height: '60vh' }}>
            <video
              className="w-full h-full object-contain bg-black"
              autoPlay
              playsInline
              ref={(el) => { if (el && screenToShow) el.srcObject = screenToShow; }}
            />
          </div>
        )}

        <div className="flex-1 overflow-auto pb-20 sm:pb-24">
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            isCameraEnabled={isCameraEnabled}
            participants={participants}
            isScreenSharing={hasScreenShare}
          />
        </div>
      </div>

      <ControlPanel
        isCameraEnabled={isCameraEnabled}
        isMicrophoneEnabled={isMicrophoneEnabled}
        isScreenSharing={isScreenSharing}
        onToggleCamera={toggleCamera}
        onToggleMicrophone={toggleMicrophone}
        onToggleScreenShare={toggleScreenShare}
        roomId={callId || ''}
      />
    </div>
  );
};

export default CallPage;

