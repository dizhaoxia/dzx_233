import express from 'express';
import { getMessages, markAsRead } from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/:sessionId', authMiddleware, getMessages);
router.post('/:sessionId/read', authMiddleware, markAsRead);

export default router;
