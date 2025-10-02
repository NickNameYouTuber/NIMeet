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
  origin: true, // Разрешаем все origin для отладки
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Content-Length', 'Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Дополнительные CORS заголовки для всех ответов
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  next();
});

// Обработка preflight запросов
app.options('*', (req, res) => {
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

