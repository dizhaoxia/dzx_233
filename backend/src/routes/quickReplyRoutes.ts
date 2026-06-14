import express from 'express';
import {
  getQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  updateSortOrder,
} from '../controllers/quickReplyController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getQuickReplies);
router.post('/', authMiddleware, createQuickReply);
router.put('/:id', authMiddleware, updateQuickReply);
router.delete('/:id', authMiddleware, deleteQuickReply);
router.put('/sort-order', authMiddleware, updateSortOrder);

export default router;
