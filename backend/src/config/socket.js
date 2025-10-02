const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true, // Разрешаем все origin для отладки
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

