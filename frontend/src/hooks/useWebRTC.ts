import { useState, useEffect, useCallback, useRef } from 'react';
import webrtcService from '../services/webrtcService';
import socketService from '../services/socketService';
import authService from '../services/authService';
import { useAuth } from './useAuth';
import { Participant } from '../types/call.types';

export const useWebRTC = (roomId: string, guestName?: string) => {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [remoteScreenStreams, setRemoteScreenStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const isInitialized = useRef(false);
  const offersCreated = useRef<Set<string>>(new Set());
  const guestId = useRef<string>(`guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const handleRemoteStream = useCallback((socketId: string, stream: MediaStream) => {
    const mySocketId = socketService.getSocket()?.id;
    console.log('handleRemoteStream вызван:', { socketId, mySocketId, isOwn: socketId === mySocketId });
    
    if (socketId === mySocketId) {
      console.log('Игнорируем свой собственный поток');
      return;
    }
    
    console.log('Добавляем удаленный поток от:', socketId, 'треки:', stream.getTracks().length);
    setRemoteStreams((prev) => {
      const newStreams = new Map(prev);
      // Создаем новый MediaStream объект для принудительного обновления React
      const newStream = new MediaStream(stream.getTracks());
      newStreams.set(socketId, newStream);
      console.log('Обновлен remoteStreams, размер:', newStreams.size, 'ключи:', Array.from(newStreams.keys()));
      return newStreams;
    });
  }, []);

  const handleRemoteStreamRemoved = useCallback((socketId: string) => {
    setRemoteStreams((prev) => {
      const newStreams = new Map(prev);
      newStreams.delete(socketId);
      return newStreams;
    });
  }, []);

  const initializeMedia = useCallback(async () => {
    if (isInitialized.current) return;
    if (!user && !guestName) {
      console.log('User и guestName не загружены, ожидаем...');
      return;
    }
    
    isInitialized.current = true;
    const displayName = user?.username || guestName || 'Гость';
    console.log('Инициализация медиа для пользователя:', displayName);

    const stream = await webrtcService.initializeLocalStream();
    setLocalStream(stream);
    
    if (stream && stream.getTracks().length > 0) {
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      setIsCameraEnabled(videoTracks.length > 0 && videoTracks[0].enabled);
      setIsMicrophoneEnabled(audioTracks.length > 0 && audioTracks[0].enabled);
    } else {
      setIsCameraEnabled(false);
      setIsMicrophoneEnabled(false);
    }

    webrtcService.onRemoteStream(handleRemoteStream);
    webrtcService.onRemoteStreamRemoved(handleRemoteStreamRemoved);
    webrtcService.onRemoteScreenStream((socketId, stream) => {
      setRemoteScreenStreams((prev) => {
        const next = new Map(prev);
        // Создаем новый MediaStream объект для принудительного обновления React
        const newStream = new MediaStream(stream.getTracks());
        next.set(socketId, newStream);
        return next;
      });
    });
    
    // Обновляем локальный поток при изменении треков
    webrtcService.onLocalStreamUpdated(() => {
      const currentStream = webrtcService.getLocalStream();
      if (currentStream) {
        setLocalStream(new MediaStream(currentStream.getTracks()));
      }
    });

    const token = authService.getToken();
    const isGuest = !user;
    const userIdToUse = isGuest ? guestId.current : user!.id;
    const usernameToUse = isGuest ? guestName! : user!.username;

    if (token || isGuest) {
      const socket = isGuest ? socketService.connectAsGuest() : socketService.connect(token!);
      
      const handleSocketConnect = () => {
        console.log('Socket подключен, присоединяюсь к комнате:', roomId);
        socketService.joinRoom(roomId, {
          userId: userIdToUse,
          username: usernameToUse,
        });
        (window as any).__NIM_CURRENT_ROOM_ID__ = roomId;
      };

      if (socket.connected) {
        handleSocketConnect();
      } else {
        socket.once('connect', handleSocketConnect);
      }

      socket.on('reconnect', () => {
        console.log('Срабатывает обработчик reconnect — повторяю join и сбрасываю offersCreated');
        offersCreated.current.clear();
        socketService.joinRoom(roomId, {
          userId: userIdToUse,
          username: usernameToUse,
        });
      });
    }

    socketService.onUserJoined(({ participant }) => {
      const mySocketId = socketService.getSocket()?.id;
      if (participant.socketId === mySocketId) {
        console.log('Игнорируем событие о самом себе');
        return;
      }
      
      console.log('Новый участник присоединился:', participant);
      
      setParticipants((prev) => {
        const newParticipants = new Map(prev);
        if (!newParticipants.has(participant.socketId)) {
          newParticipants.set(participant.socketId, participant);
        } else {
          console.log('Участник уже в списке:', participant.socketId);
        }
        return newParticipants;
      });
    });

    socketService.onExistingParticipants(({ participants }) => {
      const mySocketId = socketService.getSocket()?.id;
      console.log('Существующие участники:', participants, 'Мой socketId:', mySocketId);
      
      setParticipants((prev) => {
        const newParticipants = new Map(prev);
        participants.forEach((p) => {
          if (p.socketId !== mySocketId) {
            newParticipants.set(p.socketId, p);
          }
        });
        return newParticipants;
      });

      // Сначала обрабатываем информацию о screen sharing:
      // 1) если в participant.mediaState.screen уже true
      // 2) если пришел screenStreamId в объекте участника
      participants.forEach((existingParticipant: any) => {
        if (existingParticipant.socketId === mySocketId) return;
        const hasScreenFlag = !!existingParticipant.mediaState?.screen;
        const screenStreamId = existingParticipant.screenStreamId as string | undefined;
        if (hasScreenFlag || screenStreamId) {
          console.log('Участник', existingParticipant.socketId, 'уже стримит экран (по данным existing-participants)');
          webrtcService.markPeerExpectsScreen(existingParticipant.socketId);
          if (screenStreamId) {
            webrtcService.setAnnouncedScreenStreamId(existingParticipant.socketId, screenStreamId);
          }
        }
      });

      // Небольшая задержка, чтобы screen-share-started события успели обработаться
      setTimeout(() => {
        participants.forEach((existingParticipant) => {
          if (existingParticipant.socketId !== mySocketId && !offersCreated.current.has(existingParticipant.socketId)) {
            console.log('Создаю offer для:', existingParticipant.socketId);
            offersCreated.current.add(existingParticipant.socketId);
            webrtcService.createOffer(existingParticipant.socketId);
          }
        });
      }, 150);
    });

    socketService.onReceiveOffer(async ({ from, offer }) => {
      const mySocketId = socketService.getSocket()?.id;
      if (from === mySocketId) {
        console.log('Игнорируем offer от самого себя');
        return;
      }
      console.log('Получен offer от:', from);
      await webrtcService.handleOffer(from, offer);
    });

    socketService.onReceiveAnswer(async ({ from, answer }) => {
      const mySocketId = socketService.getSocket()?.id;
      if (from === mySocketId) {
        console.log('Игнорируем answer от самого себя');
        return;
      }
      console.log('Получен answer от:', from);
      await webrtcService.handleAnswer(from, answer);
    });

    socketService.onReceiveIceCandidate(async ({ from, candidate }) => {
      await webrtcService.handleIceCandidate(from, candidate);
    });

    socketService.onUserLeft(({ socketId }) => {
      console.log('Участник покинул комнату:', socketId);
      webrtcService.closeConnection(socketId);
      setParticipants((prev) => {
        const newParticipants = new Map(prev);
        newParticipants.delete(socketId);
        return newParticipants;
      });
      webrtcService.clearAnnouncedScreenStreamId(socketId);
    });

    socketService.onMediaToggled(({ socketId, mediaType, enabled }) => {
      setParticipants((prev) => {
        const newParticipants = new Map(prev);
        const participant = newParticipants.get(socketId);
        if (participant) {
          participant.mediaState[mediaType as keyof typeof participant.mediaState] = enabled;
          newParticipants.set(socketId, { ...participant });
        }
        return newParticipants;
      });
    });

    // Экран: сигнал о том, что у участника началась/завершилась демонстрация
    socketService.onScreenShareStarted(({ socketId, screenStreamId }) => {
      console.log('screen-share-started от', socketId, 'streamId:', screenStreamId);
      webrtcService.setAnnouncedScreenStreamId(socketId, screenStreamId);
      
      // Если мы еще не создали offer для этого участника, 
      // отметим что нужен дополнительный video transceiver для экрана
      webrtcService.markPeerExpectsScreen(socketId);
    });

    socketService.onScreenShareStopped(({ socketId }) => {
      console.log('screen-share-stopped от', socketId);
      webrtcService.clearAnnouncedScreenStreamId(socketId);
      setRemoteScreenStreams((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    });
  }, [roomId, user, guestName, handleRemoteStream, handleRemoteStreamRemoved]);

  const toggleCamera = useCallback(async () => {
    const enabled = await webrtcService.toggleCamera();
    setIsCameraEnabled(enabled);
    socketService.toggleMedia(roomId, 'camera', enabled);
  }, [roomId]);

  const toggleMicrophone = useCallback(async () => {
    const enabled = await webrtcService.toggleMicrophone();
    setIsMicrophoneEnabled(enabled);
    socketService.toggleMedia(roomId, 'microphone', enabled);
  }, [roomId]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      webrtcService.stopScreenShare();
      setIsScreenSharing(false);
      setLocalScreenStream(null);
      socketService.toggleMedia(roomId, 'screen', false);
    } else {
      const success = await webrtcService.startScreenShare();
      if (success) {
        setIsScreenSharing(true);
        setLocalScreenStream(webrtcService.getLocalScreenStream());
        socketService.toggleMedia(roomId, 'screen', true);
      }
    }
  }, [isScreenSharing, roomId]);

  const cleanup = useCallback(() => {
    socketService.leaveRoom(roomId);
    socketService.offAllListeners();
    socketService.disconnect();
    webrtcService.cleanup();
    isInitialized.current = false;
    offersCreated.current.clear();
  }, [roomId]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
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
  };
};

