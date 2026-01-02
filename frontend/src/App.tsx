import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import CallPage from './features/call/pages/CallPage';
import { Video, Users, ArrowLeft, LogOut } from 'lucide-react';
import { NIIDLoginButton } from './features/niid/components/NIIDLoginButton';
import { NIIDClient } from './features/niid/sdk/core/NIIDClient';
import { UserInfo } from './features/niid/sdk/types';

const Home = () => {
    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    const handleCreateMeeting = () => {
        const newRoomId = generateRoomId();
        window.location.href = `/call/${newRoomId}`;
    };

    const [user, setUser] = useState<UserInfo | null>(null);
    const [client, setClient] = useState<NIIDClient | null>(null);

    React.useEffect(() => {
        const niidClient = new NIIDClient({
            clientId: 'F1gW0idHtGKhrE-GqaBkHA',
            clientSecret: '02cfUSXpevaDsXXgpXflCegFJhfMuDUCFr1Re9hgP34',
            redirectUri: window.location.origin,
            ssoUrl: 'http://localhost:11706',
            apiUrl: 'http://localhost:11700'
        });
        setClient(niidClient);

        const checkAuth = async () => {
            try {
                // Check callback
                const callbackUser = await niidClient.handleCallback();
                if (callbackUser) {
                    setUser(callbackUser);
                    return;
                }

                // Check existing session
                if (niidClient.isAuthenticated()) {
                    const userInfo = await niidClient.getUserInfo();
                    setUser(userInfo);
                }
            } catch (error) {
                console.error('Home Auth Error:', error);
            }
        };

        checkAuth();
    }, []);

    const handleLogout = () => {
        if (client) {
            client.logout();
            setUser(null);
        }
    };

    const handleJoinClick = () => {
        window.location.href = '/join';
    };

    return (
        <div className="h-screen w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f0a] via-[#2d1812] to-[#0a0503]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,69,19,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(101,67,33,0.1),transparent_50%)]" />
            </div>

            <div className="absolute top-6 right-6 z-20">
                {user ? (
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full pl-1 pr-4 py-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-medium leading-none">{user.name}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-2 text-white/50 hover:text-white transition-colors"
                            title="Выйти"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <NIIDLoginButton
                        clientId="F1gW0idHtGKhrE-GqaBkHA"
                        clientSecret="02cfUSXpevaDsXXgpXflCegFJhfMuDUCFr1Re9hgP34"
                        redirectUri={window.location.origin}
                        ssoUrl="http://localhost:11706"
                        apiUrl="http://localhost:11700"
                        variant="secondary"
                        onSuccess={setUser}
                    />
                )}
            </div>

            <div className="relative z-10 h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-3xl">
                        <h1 className="text-white text-3xl md:text-4xl font-normal mb-16 text-center">
                            Видеовстречи по ссылке
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={handleCreateMeeting}
                                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex flex-col items-center text-white cursor-pointer"
                            >
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center group-hover:border-white/50 transition-colors">
                                        <Video className="w-8 h-8" strokeWidth={1.5} />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white/10"></div>
                                </div>
                                <span className="text-lg font-medium">Создать видеовстречу</span>
                            </button>

                            <button
                                onClick={handleJoinClick}
                                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex flex-col items-center text-white cursor-pointer"
                            >
                                <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-6 group-hover:border-white/50 transition-colors">
                                    <Users className="w-8 h-8" strokeWidth={1.5} />
                                </div>
                                <span className="text-lg font-medium">Подключиться</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const JoinPage = () => {
    const [roomId, setRoomId] = useState('');

    const handleJoin = () => {
        if (roomId.trim()) {
            window.location.href = `/call/${roomId.trim()}`;
        }
    };

    const handleGoBack = () => {
        window.location.href = '/';
    };

    return (
        <div className="h-screen w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f0a] via-[#2d1812] to-[#0a0503]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,69,19,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(101,67,33,0.1),transparent_50%)]" />
            </div>

            <div className="relative z-10 h-full flex flex-col">
                <button
                    onClick={handleGoBack}
                    className="absolute top-4 left-4 md:top-8 md:left-8 text-white/70 hover:text-white transition-colors flex items-center gap-2 z-20"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">Назад</span>
                </button>

                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-semibold text-white mb-2 text-center">
                                Подключиться к встрече
                            </h2>
                            <p className="text-white/60 text-sm mb-8 text-center">
                                Введите ID встречи для подключения
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-white/90 mb-2">
                                        ID встречи
                                    </label>
                                    <input
                                        type="text"
                                        value={roomId}
                                        onChange={e => setRoomId(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && roomId.trim()) {
                                                handleJoin();
                                            }
                                        }}
                                        placeholder="Введите ID встречи"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={handleJoin}
                                    disabled={!roomId.trim()}
                                    className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all disabled:hover:bg-white"
                                >
                                    Подключиться
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/call/:callId" element={<CallPage />} />
        </Routes>
    );
}

export default App;
