import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import roomService from '../services/roomService';
import { Room } from '../types/call.types';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'instant' | 'static'>('instant');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCustomId, setNewRoomCustomId] = useState('');

  useEffect(() => {
    loadUserRooms();
  }, []);

  const loadUserRooms = async () => {
    try {
      const response = await roomService.getUserRooms();
      setUserRooms(response.rooms);
    } catch (err) {
      console.error('Ошибка загрузки комнат:', err);
    }
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');

    try {
      const options = createType === 'static' 
        ? { isStatic: true, customId: newRoomCustomId.trim(), name: newRoomName.trim() }
        : {};

      const response = await roomService.createRoom(options);
      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomCustomId('');
      await loadUserRooms();
      navigate(`/call/${response.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания комнаты');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту комнату?')) {
      return;
    }

    try {
      await roomService.deleteRoom(roomId);
      await loadUserRooms();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Ошибка удаления комнаты');
    }
  };

  const handleJoinRoom = (event: React.FormEvent) => {
    event.preventDefault();
    if (joinRoomId.trim()) {
      navigate(`/call/${joinRoomId.trim()}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyRoomLink = (roomId: string) => {
    const link = `${window.location.origin}/call/${roomId}`;
    navigator.clipboard.writeText(link);
    window.alert('Ссылка скопирована!');
  };

  const staticRooms = userRooms.filter(room => room.isStatic);
  const recentRooms = userRooms.filter(room => !room.isStatic).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">NIMeet</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">
              {user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-2 rounded-xl font-medium transition text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Быстрый старт</h2>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setCreateType('instant');
                    handleCreateRoom();
                  }}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Моментальный звонок
                </button>

                <button
                  onClick={() => {
                    setCreateType('static');
                    setShowCreateModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Постоянная комната
                </button>
              </div>
            </div>

            {staticRooms.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold text-white mb-4">Мои постоянные комнаты</h2>
                <div className="space-y-2">
                  {staticRooms.map((room) => (
                    <div key={room.id} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{room.name || 'Без названия'}</h3>
                        <p className="text-gray-500 text-sm font-mono truncate">{room.customId || room.roomId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyRoomLink(room.roomId)}
                          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white p-2 rounded-lg transition"
                          title="Копировать ссылку"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/call/${room.roomId}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                        >
                          Войти
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.roomId)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                          title="Удалить"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Присоединиться</h2>
              
              <form onSubmit={handleJoinRoom} className="space-y-3">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="ID комнаты"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder:text-gray-600"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition"
                >
                  Войти
                </button>
              </form>
            </div>

            {recentRooms.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Недавние</h2>
                <div className="space-y-2">
                  {recentRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => navigate(`/call/${room.roomId}`)}
                      className="w-full bg-[#0a0a0a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg p-3 text-left transition"
                    >
                      <p className="text-white text-sm font-medium truncate">{room.name || 'Звонок'}</p>
                      <p className="text-gray-500 text-xs font-mono truncate">{room.roomId.slice(0, 12)}...</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Создать постоянную комнату</h2>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название комнаты
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Например: Команда разработки"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder:text-gray-600"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Пользовательский ID (необязательно)
                </label>
                <input
                  type="text"
                  value={newRoomCustomId}
                  onChange={(e) => setNewRoomCustomId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  placeholder="my-team-room"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder:text-gray-600 font-mono"
                  maxLength={30}
                />
                <p className="text-gray-500 text-xs mt-1">Только латиница, цифры, дефисы и подчёркивания</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                  setNewRoomName('');
                  setNewRoomCustomId('');
                }}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-3 rounded-xl font-semibold transition"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={loading || !newRoomName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
