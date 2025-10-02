const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
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
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log('Гостевое подключение Socket.IO');
        socket.isGuest = true;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.isGuest = false;
      next();
    } catch (error) {
      console.error('Ошибка аутентификации socket:', error);
      next(new Error('Неверный токен'));
    }
  });

  return io;
};

module.exports = initializeSocket;

