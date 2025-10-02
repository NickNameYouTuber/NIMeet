export interface Room {
  id: string;
  roomId: string;
  name?: string;
  ownerId: string;
  isStatic?: boolean;
  customId?: string;
  createdAt: Date;
  participants?: string[];
}

export interface CreateRoomResponse {
  room: Room;
  roomId: string;
}

export interface Participant {
  socketId: string;
  userId: string;
  username: string;
  mediaState: MediaState;
}

export interface MediaState {
  camera: boolean;
  microphone: boolean;
  screen: boolean;
}

