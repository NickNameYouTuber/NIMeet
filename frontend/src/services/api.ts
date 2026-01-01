import axios from 'axios';

// In Docker setup, backend is at localhost:8000 mapped, but through Vite proxy it's /api
// If running dev locally, we use /api proxy.

const api = axios.create({
    baseURL: '/api',
});

export const getToken = async (roomName: string, participantName: string) => {
    const response = await api.post<{ token: string }>('/token', {
        room_name: roomName,
        participant_name: participantName,
    });
    return response.data.token;
};

export const checkAccess = async (callId: string) => {
    const response = await api.get<{ hasAccess: boolean; role: string }>(`/call/${callId}/access`);
    return response.data;
};
