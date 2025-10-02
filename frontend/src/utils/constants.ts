// Определяем URL в зависимости от окружения
const isProduction = process.env.NODE_ENV === 'production';
const isTauriApp = typeof window !== 'undefined' && 
  ((window as any).__TAURI__ || 
   (window as any).__TAURI_INTERNALS__ || 
   window.location.hostname === 'tauri.localhost' ||
   window.location.protocol === 'tauri:');

// Принудительно используем продакшн URL для Tauri приложения
const forceProductionUrls = isTauriApp;

console.log('Environment detection:', {
  NODE_ENV: process.env.NODE_ENV,
  isProduction,
  isTauriApp,
  forceProductionUrls,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_SOCKET_URL: process.env.REACT_APP_SOCKET_URL,
  windowTauri: !!(window as any).__TAURI__,
  windowTauriInternals: !!(window as any).__TAURI_INTERNALS__,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined',
  protocol: typeof window !== 'undefined' ? window.location.protocol : 'undefined',
  location: typeof window !== 'undefined' ? window.location.href : 'undefined'
});

// Принудительно используем продакшн URL для Tauri приложения
// Временно используем HTTP для тестирования
export const API_BASE_URL = forceProductionUrls 
  ? 'https://meet.nicorp.tech' 
  : (process.env.REACT_APP_API_URL || 'https://meet.nicorp.tech');

export const SOCKET_URL = forceProductionUrls 
  ? 'https://meet.nicorp.tech' 
  : (process.env.REACT_APP_SOCKET_URL || 'https://meet.nicorp.tech');

console.log('Final URLs:', { API_BASE_URL, SOCKET_URL, forceProductionUrls });

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CALL: '/call/:callId',
} as const;

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { 
      urls: 'stun:stun.l.google.com:19302' 
    },
    {
      urls: [
        'turn:nit.nicorp.tech:3478',
        'turn:nit.nicorp.tech:3478?transport=tcp'
      ],
      username: 'test',
      credential: 'test'
    }
  ],
  iceCandidatePoolSize: 10,
};

export const DEFAULT_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

