import { API_BASE_URL } from '../utils/constants';
import { CreateRoomResponse, Room } from '../types/call.types';
import authService from './authService';

class RoomService {
  async createRoom(options?: { isStatic?: boolean; customId?: string; name?: string }): Promise<CreateRoomResponse> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Необходима авторизация');
    }

    const response = await fetch(`${API_BASE_URL}/api/rooms/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options || {}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка создания комнаты');
    }

    return response.json();
  }

  async getUserRooms(): Promise<{ rooms: Room[] }> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Необходима авторизация');
    }

    const response = await fetch(`${API_BASE_URL}/api/rooms/user/rooms`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения комнат');
    }

    return response.json();
  }

  async getRoomInfo(roomId: string): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Комната не найдена');
    }

    return response.json();
  }

  async deleteRoom(roomId: string): Promise<void> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Необходима авторизация');
    }

    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка удаления комнаты');
    }
  }

  async updateRoom(roomId: string, updates: { name?: string }): Promise<{ room: Room }> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Необходима авторизация');
    }

    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка обновления комнаты');
    }

    return response.json();
  }
}

const roomService = new RoomService();
export default roomService;

