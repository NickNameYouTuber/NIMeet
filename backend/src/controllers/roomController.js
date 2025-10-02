const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

exports.createRoom = async (req, res) => {
  try {
    const { isStatic = false, customId = null, name = '' } = req.body;
    let roomId;

    if (isStatic && customId) {
      const existingRoom = await Room.findOne({ customId });
      if (existingRoom) {
        return res.status(400).json({ message: 'Комната с таким ID уже существует' });
      }
      roomId = customId;
    } else {
      roomId = uuidv4();
    }

    const room = await Room.create({
      roomId,
      name,
      ownerId: req.user._id,
      isStatic,
      customId: isStatic && customId ? customId : undefined,
    });

    res.status(201).json({
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        ownerId: room.ownerId,
        isStatic: room.isStatic,
        customId: room.customId,
        createdAt: room.createdAt,
      },
      roomId: room.roomId,
    });
  } catch (error) {
    console.error('Ошибка создания комнаты:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании комнаты' });
  }
};

exports.getRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: 'Комната не найдена' });
    }

    res.json({
      id: room._id,
      roomId: room.roomId,
      name: room.name,
      ownerId: room.ownerId,
      isStatic: room.isStatic,
      customId: room.customId,
      createdAt: room.createdAt,
      participants: room.participants,
    });
  } catch (error) {
    console.error('Ошибка получения информации о комнате:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ ownerId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      rooms: rooms.map(room => ({
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        ownerId: room.ownerId,
        isStatic: room.isStatic,
        customId: room.customId,
        createdAt: room.createdAt,
      })),
    });
  } catch (error) {
    console.error('Ошибка получения комнат пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: 'Комната не найдена' });
    }

    if (room.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав на удаление комнаты' });
    }

    await Room.deleteOne({ roomId });

    res.json({ message: 'Комната удалена' });
  } catch (error) {
    console.error('Ошибка удаления комнаты:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: 'Комната не найдена' });
    }

    if (room.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав на изменение комнаты' });
    }

    if (name !== undefined) {
      room.name = name;
    }

    await room.save();

    res.json({
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        ownerId: room.ownerId,
        isStatic: room.isStatic,
        customId: room.customId,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error('Ошибка обновления комнаты:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

