require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDatabase = require('./config/database');
const initializeSocket = require('./config/socket');
const initializeWebRTCSignaling = require('./services/webrtcSignaling');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем все origin для локальной разработки
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        origin.includes('meet.nicorp.tech') ||
        origin.includes('tauri.localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Не разрешено CORS политикой'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Range']
}));

// Обработка preflight запросов
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'NIMeet API работает' });
});

connectDatabase();

const io = initializeSocket(server);
initializeWebRTCSignaling(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Окружение: ${process.env.NODE_ENV || 'development'}`);
});

