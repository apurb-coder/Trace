import express from 'express';
import { authenticateHttp } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

// Synchronize profile on registration/signup
router.post('/register', authenticateHttp, async (req, res) => {
  try {
    const { role } = req.body;
    const { userId, email } = req.user;

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { role: role || 'USER' },
      create: {
        id: userId,
        email,
        role: role || 'USER'
      }
    });

    res.status(200).json({ message: 'Sync complete', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch current session details
router.get('/me', authenticateHttp, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not registered locally' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
