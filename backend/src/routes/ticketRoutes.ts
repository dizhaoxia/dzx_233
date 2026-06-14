import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ticketController from '../controllers/ticketController.js';

const router = express.Router();

router.get('/visitor/:visitorId', ticketController.getVisitorTickets);
router.get('/stats', authMiddleware, ticketController.getTicketStats);
router.get('/my', authMiddleware, ticketController.getMyTickets);
router.get('/all', authMiddleware, ticketController.getAllTickets);
router.get('/admins', authMiddleware, ticketController.getAdmins);
router.get('/:id', authMiddleware, ticketController.getTicket);
router.post('/', authMiddleware, ticketController.createTicket);
router.put('/:id/status', authMiddleware, ticketController.updateTicketStatus);
router.put('/:id/priority', authMiddleware, ticketController.updateTicketPriority);
router.put('/:id/assign', authMiddleware, ticketController.assignTicket);
router.put('/:id', authMiddleware, ticketController.updateTicket);

export default router;
