import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { Participant } from '../types/call.types';

class SocketService {
  private socket: Socket | null = null;
  private lastRoomId: string | null = null;
  private lastUserData: { userId: string; username: string } | null = null;

  connect(token: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Socket подключен:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket отключен');
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('Socket переподключен. Попытка:', attempt);
      if (this.lastRoomId && this.lastUserData) {
        this.joinRoom(this.lastRoomId, this.lastUserData);
      }
    });

    return this.socket;
  }

  connectAsGuest(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Socket подключен (гость):', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket отключен (гость)');
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('Socket переподключен (гость). Попытка:', attempt);
      if (this.lastRoomId && this.lastUserData) {
        this.joinRoom(this.lastRoomId, this.lastUserData);
      }
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinRoom(roomId: string, userData: { userId: string; username: string }): void {
    // Запоминаем контекст для автопереподключения
    this.lastRoomId = roomId;
    this.lastUserData = userData;
    this.socket?.emit('join-room', { roomId, userData });
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leave-room', { roomId });
  }

  sendOffer(targetSocketId: string, offer: RTCSessionDescriptionInit): void {
    this.socket?.emit('offer', { targetSocketId, offer });
  }

  sendAnswer(targetSocketId: string, answer: RTCSessionDescriptionInit): void {
    this.socket?.emit('answer', { targetSocketId, answer });
  }

  sendIceCandidate(targetSocketId: string, candidate: RTCIceCandidateInit): void {
    this.socket?.emit('ice-candidate', { targetSocketId, candidate });
  }

  toggleMedia(roomId: string, mediaType: 'camera' | 'microphone' | 'screen', enabled: boolean): void {
    this.socket?.emit('toggle-media', { roomId, mediaType, enabled });
  }

  notifyScreenShareStarted(roomId: string, screenStreamId: string): void {
    this.socket?.emit('screen-share-started', { roomId, screenStreamId });
  }

  notifyScreenShareStopped(roomId: string): void {
    this.socket?.emit('screen-share-stopped', { roomId });
  }

  onUserJoined(callback: (data: { participant: Participant }) => void): void {
    this.socket?.on('user-joined', callback);
  }

  onExistingParticipants(callback: (data: { participants: Participant[] }) => void): void {
    this.socket?.on('existing-participants', callback);
  }

  onUserLeft(callback: (data: { socketId: string }) => void): void {
    this.socket?.on('user-left', callback);
  }

  onReceiveOffer(callback: (data: { from: string; offer: RTCSessionDescriptionInit }) => void): void {
    this.socket?.on('receive-offer', callback);
  }

  onReceiveAnswer(callback: (data: { from: string; answer: RTCSessionDescriptionInit }) => void): void {
    this.socket?.on('receive-answer', callback);
  }

  onReceiveIceCandidate(callback: (data: { from: string; candidate: RTCIceCandidateInit }) => void): void {
    this.socket?.on('receive-ice-candidate', callback);
  }

  onScreenShareStarted(callback: (data: { socketId: string; screenStreamId: string }) => void): void {
    this.socket?.on('screen-share-started', callback);
  }

  onScreenShareStopped(callback: (data: { socketId: string }) => void): void {
    this.socket?.on('screen-share-stopped', callback);
  }

  onMediaToggled(callback: (data: { socketId: string; mediaType: string; enabled: boolean }) => void): void {
    this.socket?.on('media-toggled', callback);
  }

  offAllListeners(): void {
    this.socket?.off('user-joined');
    this.socket?.off('existing-participants');
    this.socket?.off('user-left');
    this.socket?.off('receive-offer');
    this.socket?.off('receive-answer');
    this.socket?.off('receive-ice-candidate');
    this.socket?.off('media-toggled');
    this.socket?.off('screen-share-started');
    this.socket?.off('screen-share-stopped');
  }
}

const socketService = new SocketService();
export default socketService;

