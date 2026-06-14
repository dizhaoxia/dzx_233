import express from 'express';
import {
  getRatings,
  getRatingBySessionId,
  createRating,
  getAdminStats,
} from '../controllers/ratingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getRatings);
router.get('/stats', authMiddleware, getAdminStats);
router.get('/session/:sessionId', authMiddleware, getRatingBySessionId);
router.post('/', createRating);

export default router;
