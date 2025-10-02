import { RTC_CONFIG, DEFAULT_MEDIA_CONSTRAINTS } from '../utils/constants';
import socketService from './socketService';

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private remoteCameraStreams: Map<string, MediaStream> = new Map();
  private remoteScreenStreams: Map<string, MediaStream> = new Map();
  private remoteSocketIdToScreenStreamId: Map<string, string> = new Map();
  private peersExpectingScreen: Set<string> = new Set();
  private onRemoteStreamCallback: ((socketId: string, stream: MediaStream) => void) | null = null;
  private onRemoteScreenStreamCallback: ((socketId: string, stream: MediaStream) => void) | null = null;
  private onRemoteStreamRemovedCallback: ((socketId: string) => void) | null = null;
  private onLocalStreamUpdatedCallback: (() => void) | null = null;
  private recvonlyAddedForPeer: Set<string> = new Set();

  async initializeLocalStream(constraints: MediaStreamConstraints = DEFAULT_MEDIA_CONSTRAINTS): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Ошибка получения медиа устройств:', error);
      this.localStream = new MediaStream();
      return this.localStream;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStreams(): Map<string, MediaStream> {
    return this.remoteCameraStreams;
  }

  getRemoteScreenStreams(): Map<string, MediaStream> {
    return this.remoteScreenStreams;
  }

  getLocalScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  createPeerConnection(remoteSocketId: string): RTCPeerConnection {
    if (this.peerConnections.has(remoteSocketId)) {
      return this.peerConnections.get(remoteSocketId)!;
    }

    const peerConnection = new RTCPeerConnection(RTC_CONFIG);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(remoteSocketId, event.candidate.toJSON());
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('Получен track от:', remoteSocketId, 'kind:', event.track.kind, 'stream.id:', event.streams[0]?.id, 'label:', event.track.label);
      const [remoteStream] = event.streams;
      
      if (event.track.kind === 'video') {
        // Определяем экранный поток по явно объявленному streamId через сигналинг,
        // иначе используем эвристику по label/displaySurface
        const streamId = remoteStream?.id || '';
        const announcedScreenId = this.remoteSocketIdToScreenStreamId.get(remoteSocketId);
        const label = (event.track.label || '').toLowerCase();
        const settings = event.track.getSettings ? event.track.getSettings() : {};
        const hasDisplaySurface = !!(settings as any).displaySurface;
        
        const noAudioInStream = remoteStream && remoteStream.getAudioTracks().length === 0;
        const singleVideoOnly = remoteStream && remoteStream.getVideoTracks().length === 1 && noAudioInStream;
        const cameraAlreadyPresent = this.remoteCameraStreams.has(remoteSocketId);
        const isLikelyScreenByTracks = !!singleVideoOnly && cameraAlreadyPresent;

        const isScreenStream = 
          (!!announcedScreenId && streamId === announcedScreenId) ||
          streamId.startsWith('screen-') || 
          label.includes('screen') || 
          label.includes('window') || 
          label.includes('monitor') ||
          hasDisplaySurface ||
          isLikelyScreenByTracks;
        
        if (isScreenStream) {
          console.log('Это экранный поток (определено по:', { streamId, label, hasDisplaySurface }, '), добавляем в remoteScreenStreams');
          // Создаем новый stream только для экрана, если его еще нет
          let screenStream = this.remoteScreenStreams.get(remoteSocketId);
          if (!screenStream) {
            screenStream = new MediaStream();
            this.remoteScreenStreams.set(remoteSocketId, screenStream);
          }
          screenStream.addTrack(event.track);
          
          if (this.onRemoteScreenStreamCallback) {
            this.onRemoteScreenStreamCallback(remoteSocketId, screenStream);
          }
        } else {
          console.log('Это камерный поток, добавляем в remoteCameraStreams');
          // Всегда обновляем камерный поток при получении нового трека
          this.remoteCameraStreams.set(remoteSocketId, remoteStream);
          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(remoteSocketId, remoteStream);
          }
        }
      } else if (event.track.kind === 'audio') {
        // аудио добавляем в камерный stream
        this.remoteCameraStreams.set(remoteSocketId, remoteStream);
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(remoteSocketId, remoteStream);
        }
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Состояние подключения с ${remoteSocketId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        console.log(`Подключение с ${remoteSocketId} разорвано, пробуем ICE restart`);
        this.createOffer(remoteSocketId, { iceRestart: true })
          .catch((e) => console.warn('ICE restart offer failed:', e));
      }
    };

    if (this.localStream && this.localStream.getTracks().length > 0) {
      const existingTracks = peerConnection.getSenders().map(sender => sender.track);
      
      this.localStream.getTracks().forEach((track) => {
        if (!existingTracks.includes(track)) {
          console.log(`Добавляем ${track.kind} track для ${remoteSocketId}`);
          peerConnection.addTrack(track, this.localStream!);
        }
      });
    } else {
      console.log(`Нет локальных треков для добавления в соединение с ${remoteSocketId}`);
      // Добавляем приемники, чтобы получать медиа от удаленного участника,
      // даже если у нас нет локальных треков (join без камеры/микрофона)
      if (!this.recvonlyAddedForPeer.has(remoteSocketId)) {
        const kindsNeeded: Array<'audio' | 'video'> = ['audio', 'video'];
        const existingKinds = peerConnection.getTransceivers().map(t => t.receiver.track?.kind).filter(Boolean) as string[];
        kindsNeeded.forEach(kind => {
          if (!existingKinds.includes(kind)) {
            try {
              peerConnection.addTransceiver(kind, { direction: 'recvonly' });
              console.log(`Добавлен recvonly transceiver для ${kind} к ${remoteSocketId}`);
            } catch (e) {
              console.warn(`Не удалось добавить recvonly для ${kind}:`, e);
            }
          }
        });
        this.recvonlyAddedForPeer.add(remoteSocketId);
      }
      
      // Если ожидаем screen share от этого участника, добавим дополнительный video transceiver
      if (this.peersExpectingScreen.has(remoteSocketId)) {
        const videoTransceivers = peerConnection.getTransceivers().filter(t => t.receiver.track?.kind === 'video');
        if (videoTransceivers.length < 2) {
          try {
            peerConnection.addTransceiver('video', { direction: 'recvonly' });
            console.log(`Добавлен дополнительный video transceiver для screen share от ${remoteSocketId}`);
          } catch (e) {
            console.warn('Не удалось добавить дополнительный video transceiver:', e);
          }
        }
      }
    }

    // Если уже идет демонстрация экрана, добавим её трек в новый peer
    if (this.screenStream) {
      const screenTrack = this.screenStream.getVideoTracks()[0];
      if (screenTrack) {
        const hasSameTrack = peerConnection.getSenders().some(s => s.track === screenTrack);
        if (!hasSameTrack) {
          try {
            const screenStreamForPeer = new MediaStream([screenTrack]);
            Object.defineProperty(screenStreamForPeer, 'id', {
              value: `screen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              writable: false,
              configurable: true
            });
            peerConnection.addTrack(screenTrack, screenStreamForPeer);
            console.log('Добавлен screen track в новый peer', remoteSocketId, 'stream ID:', screenStreamForPeer.id);
          } catch (e) {
            console.warn('Не удалось добавить screen track для нового peer:', e);
          }
        }
      }
    }

    this.peerConnections.set(remoteSocketId, peerConnection);
    return peerConnection;
  }

  async createOffer(remoteSocketId: string, options?: RTCOfferOptions): Promise<void> {
    let peerConnection = this.peerConnections.get(remoteSocketId);
    
    if (!peerConnection) {
      peerConnection = this.createPeerConnection(remoteSocketId);
    }
    
    try {
      // Если нет локальных треков, убедимся, что у нас есть recvonly transceivers,
      // чтобы в offer были m-lines для медиа от удаленного участника
      if ((!this.localStream || this.localStream.getTracks().length === 0) && !this.recvonlyAddedForPeer.has(remoteSocketId)) {
        try {
          peerConnection.addTransceiver('audio', { direction: 'recvonly' });
          peerConnection.addTransceiver('video', { direction: 'recvonly' });
          console.log(`Добавлены recvonly transceivers перед offer для ${remoteSocketId}`);
          this.recvonlyAddedForPeer.add(remoteSocketId);
        } catch (e) {
          console.warn('Не удалось добавить recvonly transceivers перед offer:', e);
        }
      }

      if (peerConnection.signalingState === 'stable') {
        const offer = await peerConnection.createOffer(options);
        await peerConnection.setLocalDescription(offer);
        socketService.sendOffer(remoteSocketId, offer);
      } else {
        console.log(`Не создаем offer для ${remoteSocketId}, состояние: ${peerConnection.signalingState}`);
      }
    } catch (error) {
      console.error('Ошибка создания offer:', error);
    }
  }

  async handleOffer(remoteSocketId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let peerConnection = this.peerConnections.get(remoteSocketId);
    
    if (!peerConnection) {
      peerConnection = this.createPeerConnection(remoteSocketId);
    } else {
      // Если peer connection уже существует, проверяем, нужно ли добавить screen track
      if (this.screenStream) {
        const screenTrack = this.screenStream.getVideoTracks()[0];
        if (screenTrack) {
          const hasSameTrack = peerConnection.getSenders().some(s => s.track === screenTrack);
          if (!hasSameTrack) {
            try {
              const screenStreamForPeer = new MediaStream([screenTrack]);
              Object.defineProperty(screenStreamForPeer, 'id', {
                value: `screen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                writable: false,
                configurable: true
              });
              peerConnection.addTrack(screenTrack, screenStreamForPeer);
              console.log('Добавлен screen track в существующий peer при handleOffer', remoteSocketId, 'stream ID:', screenStreamForPeer.id);
            } catch (e) {
              console.warn('Не удалось добавить screen track в handleOffer:', e);
            }
          }
        }
      }
    }

    try {
      if (peerConnection.signalingState === 'stable' || peerConnection.signalingState === 'have-remote-offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Добавляем локальные треки если они есть
        if (this.localStream) {
          const audioTrack = this.localStream.getAudioTracks()[0];
          const videoTrack = this.localStream.getVideoTracks()[0];
          
          if (audioTrack) {
            const hasAudioSender = peerConnection.getSenders().some(s => s.track?.kind === 'audio');
            if (!hasAudioSender) {
              peerConnection.addTrack(audioTrack, this.localStream);
              console.log('Добавлен audio track в handleOffer для', remoteSocketId);
            }
          }
          
          if (videoTrack) {
            const hasVideoSender = peerConnection.getSenders().some(s => s.track?.kind === 'video');
            if (!hasVideoSender) {
              peerConnection.addTrack(videoTrack, this.localStream);
              console.log('Добавлен video track в handleOffer для', remoteSocketId);
            }
          }
        }
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socketService.sendAnswer(remoteSocketId, answer);
      } else {
        console.log(`Игнорируем offer от ${remoteSocketId}, состояние: ${peerConnection.signalingState}`);
      }
    } catch (error) {
      console.error('Ошибка обработки offer:', error);
    }
  }

  async handleAnswer(remoteSocketId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(remoteSocketId);
    
    if (peerConnection) {
      try {
        if (peerConnection.signalingState === 'have-local-offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } else {
          console.log(`Игнорируем answer от ${remoteSocketId}, состояние: ${peerConnection.signalingState}`);
        }
      } catch (error) {
        console.error('Ошибка обработки answer:', error);
      }
    }
  }

  async handleIceCandidate(remoteSocketId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(remoteSocketId);
    
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Ошибка добавления ICE кандидата:', error);
      }
    }
  }

  async toggleCamera(): Promise<boolean> {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    
    if (videoTrack) {
      // Проверяем, включен ли трек в peer connections
      const isEnabledInPeers = Array.from(this.peerConnections.values()).some(peerConnection => {
        const videoSender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        return videoSender && videoSender.track && videoSender.track.enabled;
      });
      
      if (isEnabledInPeers) {
        // Отключаем video track только в peer connections
        this.peerConnections.forEach((peerConnection) => {
          const videoSender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');
          if (videoSender && videoSender.track) {
            videoSender.track.enabled = false;
          }
        });
        
        return false;
      } else {
        // Включаем трек во всех peer connections
        this.peerConnections.forEach((peerConnection) => {
          const videoSender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');
          if (videoSender && videoSender.track) {
            videoSender.track.enabled = true;
          }
        });
        
        return true;
      }
    } else {
      try {
        // Если трека нет вообще - создаем новый
        const newStream = await navigator.mediaDevices.getUserMedia({ video: DEFAULT_MEDIA_CONSTRAINTS.video });
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        this.localStream.addTrack(newVideoTrack);
        
        // Уведомляем об обновлении локального потока
        if (this.onLocalStreamUpdatedCallback) {
          this.onLocalStreamUpdatedCallback();
        }
        
        // Обновляем все существующие peer connections
        this.peerConnections.forEach((peerConnection) => {
          const videoSender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');
          if (videoSender) {
            // Заменяем трек в существующем sender
            videoSender.replaceTrack(newVideoTrack);
          } else {
            // Если sender нет - добавляем новый трек
            peerConnection.addTrack(newVideoTrack, this.localStream!);
          }
        });
        
        return true;
      } catch (error) {
        console.error('Ошибка включения камеры:', error);
        return false;
      }
    }
  }

  async toggleMicrophone(): Promise<boolean> {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    
    if (audioTrack) {
      // Проверяем, включен ли трек в peer connections
      const isEnabledInPeers = Array.from(this.peerConnections.values()).some(peerConnection => {
        const audioSender = peerConnection.getSenders().find((s) => s.track?.kind === 'audio');
        return audioSender && audioSender.track && audioSender.track.enabled;
      });
      
      if (isEnabledInPeers) {
        // Отключаем audio track только в peer connections
        this.peerConnections.forEach((peerConnection) => {
          const audioSender = peerConnection.getSenders().find((s) => s.track?.kind === 'audio');
          if (audioSender && audioSender.track) {
            audioSender.track.enabled = false;
          }
        });
        
        return false;
      } else {
        // Включаем трек во всех peer connections
        this.peerConnections.forEach((peerConnection) => {
          const audioSender = peerConnection.getSenders().find((s) => s.track?.kind === 'audio');
          if (audioSender && audioSender.track) {
            audioSender.track.enabled = true;
          }
        });
        
        return true;
      }
    } else {
      try {
        // Если трека нет вообще - создаем новый
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: DEFAULT_MEDIA_CONSTRAINTS.audio });
        const newAudioTrack = newStream.getAudioTracks()[0];
        
        this.localStream.addTrack(newAudioTrack);
        
        // Уведомляем об обновлении локального потока
        if (this.onLocalStreamUpdatedCallback) {
          this.onLocalStreamUpdatedCallback();
        }
        
        // Обновляем все существующие peer connections
        this.peerConnections.forEach((peerConnection) => {
          const audioSender = peerConnection.getSenders().find((s) => s.track?.kind === 'audio');
          if (audioSender) {
            // Заменяем трек в существующем sender
            audioSender.replaceTrack(newAudioTrack);
          } else {
            // Если sender нет - добавляем новый трек
            peerConnection.addTrack(newAudioTrack, this.localStream!);
          }
        });
        
        return true;
      } catch (error) {
        console.error('Ошибка включения микрофона:', error);
        return false;
      }
    }
  }

  async startScreenShare(): Promise<boolean> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = this.screenStream.getVideoTracks()[0];

      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      console.log('Создан screen stream с ID:', this.screenStream.id);
      // Уведомим через сокет свой streamId для экрана
      const roomId = (window as any).__NIM_CURRENT_ROOM_ID__;
      if (roomId) {
        try { socketService.notifyScreenShareStarted(roomId, this.screenStream.id); } catch {}
      }

      // Добавляем экран как отдельный video sender со специальным stream
      // Создаем новый MediaStream wrapper с префиксом в ID (используя метку трека)
      this.peerConnections.forEach((peerConnection) => {
        try {
          // Создаем уникальный stream для экрана с префиксом
          const screenStreamForPeer = new MediaStream([screenTrack]);
          Object.defineProperty(screenStreamForPeer, 'id', {
            value: `screen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            writable: false,
            configurable: true
          });
          
          peerConnection.addTrack(screenTrack, screenStreamForPeer);
          console.log('Screen track добавлен в peer connection с stream ID:', screenStreamForPeer.id);
        } catch (e) {
          console.warn('Не удалось добавить screen track:', e);
        }
      });

      // Триггерим renegotiation для всех собеседников
      this.peerConnections.forEach((_, remoteSocketId) => {
        this.createOffer(remoteSocketId).catch((e) => console.warn('Renegotiate offer (screen) failed:', e));
      });

      return true;
    } catch (error) {
      console.error('Ошибка начала screen share:', error);
      return false;
    }
  }

  stopScreenShare(): boolean {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
      const roomId = (window as any).__NIM_CURRENT_ROOM_ID__;
      if (roomId) {
        try { socketService.notifyScreenShareStopped(roomId); } catch {}
      }

      // Экранный трек был добавлен вторым, поэтому удалим любые senders без активного track
      this.peerConnections.forEach((peerConnection) => {
        peerConnection.getSenders()
          .filter((s) => s.track && s.track.kind === 'video' && s.track.readyState === 'ended')
          .forEach((sender) => {
            try { peerConnection.removeTrack(sender); } catch {}
          });
      });

      // Триггерим renegotiation, чтобы убрать m-line экрана у собеседников
      this.peerConnections.forEach((_, remoteSocketId) => {
        this.createOffer(remoteSocketId).catch((e) => console.warn('Renegotiate offer (stop screen) failed:', e));
      });

      return true;
    }
    return false;
  }

  closeConnection(remoteSocketId: string): void {
    const peerConnection = this.peerConnections.get(remoteSocketId);
    
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(remoteSocketId);
    }

    this.remoteCameraStreams.delete(remoteSocketId);
    this.remoteScreenStreams.delete(remoteSocketId);

    if (this.onRemoteStreamRemovedCallback) {
      this.onRemoteStreamRemovedCallback(remoteSocketId);
    }
  }

  cleanup(): void {
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.close();
    });
    this.peerConnections.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    this.remoteCameraStreams.clear();
    this.remoteScreenStreams.clear();
  }

  onRemoteStream(callback: (socketId: string, stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  onRemoteScreenStream(callback: (socketId: string, stream: MediaStream) => void): void {
    this.onRemoteScreenStreamCallback = callback;
  }
 
  onRemoteStreamRemoved(callback: (socketId: string) => void): void {
    this.onRemoteStreamRemovedCallback = callback;
  }

  onLocalStreamUpdated(callback: () => void): void {
    this.onLocalStreamUpdatedCallback = callback;
  }

  // Вызовы из вне при приходе сигналинга о начале/окончании шеринга экрана
  setAnnouncedScreenStreamId(remoteSocketId: string, streamId: string): void {
    this.remoteSocketIdToScreenStreamId.set(remoteSocketId, streamId);
  }

  clearAnnouncedScreenStreamId(remoteSocketId: string): void {
    this.remoteSocketIdToScreenStreamId.delete(remoteSocketId);
    this.remoteScreenStreams.delete(remoteSocketId);
    this.peersExpectingScreen.delete(remoteSocketId);
    if (this.onRemoteStreamRemovedCallback) {
      this.onRemoteStreamRemovedCallback(remoteSocketId);
    }
  }
  
  markPeerExpectsScreen(remoteSocketId: string): void {
    this.peersExpectingScreen.add(remoteSocketId);
  }
}

const webrtcService = new WebRTCService();
export default webrtcService;

