import express from 'express';
import { login, logout, updateStatus } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.put('/status', authMiddleware, updateStatus);

export default router;
