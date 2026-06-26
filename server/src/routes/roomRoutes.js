import express from 'express';
import { authenticateHttp } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { deleteRoomSnapshot } from '../services/redisService.js';

const router = express.Router();

// Fetch authenticated user's rooms
router.get('/', authenticateHttp, async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const rooms = await prisma.room.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch single room details publicly (so anyone with the share link can open it)
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new room
router.post('/', authenticateHttp, async (req, res) => {
  try {
    const { name } = req.body;
    const ownerId = req.user.userId;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const room = await prisma.room.create({
      data: { name, ownerId }
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename room
router.patch('/:roomId', authenticateHttp, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;
    const ownerId = req.user.userId;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const room = await prisma.room.findFirst({
      where: { id: roomId, ownerId }
    });
    if (!room) return res.status(404).json({ error: 'Room not found or unauthorized' });

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { name }
    });
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete room (DB cascade + clear Redis snapshot)
router.delete('/:roomId', authenticateHttp, async (req, res) => {
  try {
    const { roomId } = req.params;
    const ownerId = req.user.userId;

    const room = await prisma.room.findFirst({
      where: { id: roomId, ownerId }
    });
    if (!room) return res.status(404).json({ error: 'Room not found or unauthorized' });

    await prisma.room.delete({ where: { id: roomId } });
    await deleteRoomSnapshot(roomId);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
