# NIMeet Frontend

Frontend для видеозвон приложения NIMeet на React с TypeScript и Tailwind CSS.

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Запуск приложения

Режим разработки:
```bash
npm start
```

Приложение откроется на `http://localhost:3000`

Production build:
```bash
npm run build
```

## Основные функции

### Аутентификация
- Регистрация нового пользователя
- Вход в систему
- JWT токены для авторизации

### Dashboard
- Создание новой комнаты для звонка
- Присоединение к существующей комнате по ID
- Копирование ссылки на комнату

### Видеозвон
- WebRTC peer-to-peer соединения
- Сетка видео с адаптивной раскладкой
- Управление камерой (вкл/выкл)
- Управление микрофоном (вкл/выкл)
- Демонстрация экрана
- Отображение участников без камеры (аватары)
- Автоматическое получение потоков при присоединении
- Копирование ссылки на комнату

## Структура проекта

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/                # Компоненты аутентификации
│   │   ├── call/
│   │   │   ├── VideoGrid.tsx    # Сетка видео
│   │   │   ├── VideoTile.tsx    # Плитка видео
│   │   │   └── ControlPanel.tsx # Панель управления
│   │   └── shared/
│   │       └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── CallPage.tsx
│   ├── services/
│   │   ├── authService.ts       # API аутентификации
│   │   ├── roomService.ts       # API комнат
│   │   ├── socketService.ts     # Socket.io клиент
│   │   └── webrtcService.ts     # WebRTC логика
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useWebRTC.ts         # Хук для WebRTC
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── call.types.ts
│   │   └── stream.types.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── utils/
│   │   └── constants.ts
│   └── App.tsx
├── tailwind.config.js
└── package.json
```

## Технологии

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **React Router** - маршрутизация
- **Socket.io-client** - real-time коммуникация
- **WebRTC API** - видео/аудио потоки

## WebRTC Конфигурация

Используются публичные STUN серверы:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

Для production рекомендуется настроить TURN сервер для работы через NAT/firewall.

## Браузерная совместимость

Приложение тестировалось на:
- Chrome/Edge (Chromium)
- Firefox
- Safari (macOS, iOS)

WebRTC требует HTTPS в production окружении.
