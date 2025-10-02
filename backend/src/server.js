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
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:7677',
    'https://meet.nicorp.tech',
    'http://meet.nicorp.tech'
  ],
  credentials: true,
}));

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

