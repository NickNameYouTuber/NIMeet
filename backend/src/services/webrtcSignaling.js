const rooms = new Map();

const initializeWebRTCSignaling = (io) => {
  io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    socket.on('join-room', ({ roomId, userData }) => {
      console.log(`${userData.username} присоединяется к комнате ${roomId}`);

      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }

      const roomParticipants = rooms.get(roomId);

      for (const [sid, p] of roomParticipants.entries()) {
        if (p.userId === userData.userId && sid !== socket.id) {
          roomParticipants.delete(sid);
          socket.to(roomId).emit('user-left', { socketId: sid });
          try {
            const oldSocket = io.sockets.sockets.get(sid);
            if (oldSocket) {
              oldSocket.leave(roomId);
              oldSocket.disconnect(true);
            }
          } catch {}
        }
      }
      const existingParticipants = Array.from(roomParticipants.values());

      const participant = {
        socketId: socket.id,
        userId: userData.userId,
        username: userData.username,
        mediaState: {
          camera: true,
          microphone: true,
          screen: false,
        },
      };

      if (existingParticipants.length > 0) {
        socket.emit('existing-participants', {
          participants: existingParticipants,
        });
        
        // Уведомляем о всех активных screen shares от существующих участников
        existingParticipants.forEach((existingP) => {
          if (existingP.screenStreamId) {
            socket.emit('screen-share-started', {
              socketId: existingP.socketId,
              screenStreamId: existingP.screenStreamId,
            });
          }
        });
      }

      roomParticipants.set(socket.id, participant);

      socket.to(roomId).emit('user-joined', {
        participant,
      });

      console.log(`Участники комнаты ${roomId}:`, roomParticipants.size);
    });

    socket.on('offer', ({ targetSocketId, offer }) => {
      console.log(`Отправка offer от ${socket.id} к ${targetSocketId}`);
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        console.log(`Цель ${targetSocketId} найдена, отправляем offer`);
        targetSocket.emit('receive-offer', {
          from: socket.id,
          offer,
        });
      } else {
        console.log(`Цель ${targetSocketId} НЕ найдена`);
      }
    });

    socket.on('answer', ({ targetSocketId, answer }) => {
      console.log(`Отправка answer от ${socket.id} к ${targetSocketId}`);
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        console.log(`Цель ${targetSocketId} найдена, отправляем answer`);
        targetSocket.emit('receive-answer', {
          from: socket.id,
          answer,
        });
      } else {
        console.log(`Цель ${targetSocketId} НЕ найдена`);
      }
    });

    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('receive-ice-candidate', {
        from: socket.id,
        candidate,
      });
    });

    socket.on('toggle-media', ({ roomId, mediaType, enabled }) => {
      const roomParticipants = rooms.get(roomId);
      
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        participant.mediaState[mediaType] = enabled;
        
        socket.to(roomId).emit('media-toggled', {
          socketId: socket.id,
          mediaType,
          enabled,
        });
      }
    });

    // Явные события начала/окончания демонстрации экрана с передачей streamId
    socket.on('screen-share-started', ({ roomId, screenStreamId }) => {
      console.log(`Screen share STARTED от ${socket.id}, streamId: ${screenStreamId}`);
      
      const roomParticipants = rooms.get(roomId);
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        participant.screenStreamId = screenStreamId;
      }
      
      socket.to(roomId).emit('screen-share-started', {
        socketId: socket.id,
        screenStreamId,
      });
    });

    socket.on('screen-share-stopped', ({ roomId }) => {
      console.log(`Screen share STOPPED от ${socket.id}`);
      
      const roomParticipants = rooms.get(roomId);
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        delete participant.screenStreamId;
      }
      
      socket.to(roomId).emit('screen-share-stopped', {
        socketId: socket.id,
      });
    });

    socket.on('leave-room', ({ roomId }) => {
      handleUserDisconnect(socket, roomId);
    });

    socket.on('disconnect', () => {
      console.log('Пользователь отключился:', socket.id);

      rooms.forEach((participants, roomId) => {
        if (participants.has(socket.id)) {
          handleUserDisconnect(socket, roomId);
        }
      });
    });
  });

  const handleUserDisconnect = (socket, roomId) => {
    const roomParticipants = rooms.get(roomId);
    
    if (roomParticipants) {
      roomParticipants.delete(socket.id);
      
      socket.to(roomId).emit('user-left', {
        socketId: socket.id,
      });

      socket.leave(roomId);

      if (roomParticipants.size === 0) {
        rooms.delete(roomId);
        console.log(`Комната ${roomId} удалена (пустая)`);
      } else {
        console.log(`Участники комнаты ${roomId}:`, roomParticipants.size);
      }
    }
  };
};

module.exports = initializeWebRTCSignaling;

