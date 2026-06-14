import express from 'express';
import {
  getSessions,
  getSession,
  endSession,
  getVisitorHistory,
  getVisitorSession
} from '../controllers/sessionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getSessions);
router.get('/visitor/:visitorId/history', authMiddleware, getVisitorHistory);
router.get('/visitor/:visitorId/active', authMiddleware, getVisitorSession);
router.get('/:id', authMiddleware, getSession);
router.put('/:id/end', authMiddleware, endSession);

export default router;
