import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';
import type { Express } from 'express';
import * as SessionModel from '../models/Session.js';
import * as MessageModel from '../models/Message.js';
import * as AdminModel from '../models/Admin.js';
import { assignSession, processWaitingSessions } from '../services/assignmentService.js';
import { addToQueue, removeFromQueue, getQueuePosition, syncQueueFromDB } from '../services/queueService.js';
import type { SocketData, AdminStatus, SenderType } from '../types/index.js';

interface ServerToClientEvents {
  'session:queued': (data: { position: number }) => void;
  'session:assigned': (data: { session: any; admin?: any; messages?: any[] }) => void;
  'session:new': (data: { session: any }) => void;
  'session:ended': (data: { sessionId: number }) => void;
  'message:new': (data: { message: any }) => void;
  'message:read': (data: { sessionId: number; senderType: SenderType }) => void;
  'admin:online': (data: { adminId: number }) => void;
  'admin:status': (data: { adminId: number; status: AdminStatus }) => void;
  'typing': (data: { sessionId: number; sender: string }) => void;
  'error': (data: { message: string }) => void;
}

interface ClientToServerEvents {
  'visitor:connect': (data: { visitorId: string }) => void;
  'visitor:message': (data: { sessionId: number; content: string }) => void;
  'visitor:close': (data: { sessionId: number }) => void;
  'admin:login': (data: { adminId: number }) => void;
  'admin:logout': (data: { adminId: number }) => void;
  'admin:status': (data: { adminId: number; status: AdminStatus }) => void;
  'admin:message': (data: { sessionId: number; content: string }) => void;
  'admin:join': (data: { sessionId: number }) => void;
  'admin:end': (data: { sessionId: number }) => void;
  'typing': (data: { sessionId: number; sender: string }) => void;
  'message:read': (data: { sessionId: number; senderType: SenderType }) => void;
  'queue:refresh': (data: { sessionId: number }) => void;
}

export const setupSocket = (expressServer: Express): { io: SocketIOServer; httpServer: any } => {
  const httpServer = createServer(expressServer);
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  syncQueueFromDB().catch(console.error);

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>) => {
    console.log('Client connected:', socket.id);

    socket.on('visitor:connect', async (data) => {
      try {
        const { visitorId } = data;
        socket.data.visitorId = visitorId;
        socket.join(`visitor:${visitorId}`);

        let session = await SessionModel.findActiveByVisitorId(visitorId);
        
        if (!session) {
          session = await SessionModel.create(visitorId);
        }

        socket.data.sessionId = session.id;
        socket.join(`session:${session.id}`);

        const messages = await MessageModel.findBySessionId(session.id);

        if (session.status === 'waiting') {
          const position = addToQueue(session.id, visitorId);
          socket.emit('session:queued', { position });
        } else if (session.status === 'active') {
          let adminInfo = null;
          if (session.adminId) {
            const admin = await AdminModel.findById(session.adminId);
            if (admin) {
              adminInfo = { id: admin.id, username: admin.username };
            }
          }
          socket.emit('session:assigned', {
            session,
            admin: adminInfo,
            messages
          });
        }
      } catch (error) {
        console.error('Visitor connect error:', error);
        socket.emit('error', { message: '连接失败' });
      }
    });

    socket.on('visitor:message', async (data) => {
      try {
        const { sessionId, content } = data;
        if (!content?.trim()) return;

        const message = await MessageModel.create(sessionId, 'visitor', content.trim());
        const session = await SessionModel.findById(sessionId);

        io.to(`session:${sessionId}`).emit('message:new', { message });

        if (session?.adminId) {
          io.to(`admin:${session.adminId}`).emit('message:new', { message });
        }
      } catch (error) {
        console.error('Visitor message error:', error);
        socket.emit('error', { message: '发送消息失败' });
      }
    });

    socket.on('visitor:close', async (data) => {
      try {
        const { sessionId } = data;
        await SessionModel.updateStatus(sessionId, 'ended');
        removeFromQueue(sessionId);
        
        const session = await SessionModel.findById(sessionId);
        
        io.to(`session:${sessionId}`).emit('session:ended', { sessionId });
        
        if (session?.adminId) {
          io.to(`admin:${session.adminId}`).emit('session:ended', { sessionId });
        }
      } catch (error) {
        console.error('Visitor close error:', error);
        socket.emit('error', { message: '关闭会话失败' });
      }
    });

    socket.on('admin:login', async (data) => {
      try {
        const { adminId } = data;
        socket.data.adminId = adminId;
        socket.join(`admin:${adminId}`);
        
        await AdminModel.updateStatus(adminId, 'online');
        
        io.emit('admin:online', { adminId });
        
        await processWaitingSessions(io);
      } catch (error) {
        console.error('Admin login error:', error);
        socket.emit('error', { message: '登录失败' });
      }
    });

    socket.on('admin:logout', async (data) => {
      try {
        const { adminId } = data;
        await AdminModel.updateStatus(adminId, 'offline');
        socket.leave(`admin:${adminId}`);
        socket.data.adminId = undefined;
      } catch (error) {
        console.error('Admin logout error:', error);
        socket.emit('error', { message: '登出失败' });
      }
    });

    socket.on('admin:status', async (data) => {
      try {
        const { adminId, status } = data;
        await AdminModel.updateStatus(adminId, status);
        
        if (status === 'online') {
          await processWaitingSessions(io);
        }
        
        io.emit('admin:status', { adminId, status });
      } catch (error) {
        console.error('Admin status error:', error);
        socket.emit('error', { message: '状态更新失败' });
      }
    });

    socket.on('admin:message', async (data) => {
      try {
        const { sessionId, content } = data;
        if (!content?.trim()) return;

        const message = await MessageModel.create(sessionId, 'admin', content.trim());
        const session = await SessionModel.findById(sessionId);

        io.to(`session:${sessionId}`).emit('message:new', { message });
        
        if (session?.visitorId) {
          io.to(`visitor:${session.visitorId}`).emit('message:new', { message });
        }
      } catch (error) {
        console.error('Admin message error:', error);
        socket.emit('error', { message: '发送消息失败' });
      }
    });

    socket.on('admin:join', (data) => {
      const { sessionId } = data;
      socket.join(`session:${sessionId}`);
    });

    socket.on('admin:end', async (data) => {
      try {
        const { sessionId } = data;
        await SessionModel.updateStatus(sessionId, 'ended');
        removeFromQueue(sessionId);
        
        const session = await SessionModel.findById(sessionId);
        
        io.to(`session:${sessionId}`).emit('session:ended', { sessionId });
        
        if (session?.visitorId) {
          io.to(`visitor:${session.visitorId}`).emit('session:ended', { sessionId });
        }
      } catch (error) {
        console.error('Admin end error:', error);
        socket.emit('error', { message: '结束会话失败' });
      }
    });

    socket.on('typing', (data) => {
      const { sessionId, sender } = data;
      socket.to(`session:${sessionId}`).emit('typing', { sessionId, sender });
    });

    socket.on('message:read', async (data) => {
      try {
        const { sessionId, senderType } = data;
        await MessageModel.markAsRead(sessionId, senderType);
        socket.to(`session:${sessionId}`).emit('message:read', { sessionId, senderType });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('queue:refresh', async (data) => {
      const { sessionId } = data;
      const position = getQueuePosition(sessionId);
      socket.emit('session:queued', { position });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.data.adminId) {
        AdminModel.updateStatus(socket.data.adminId, 'offline').catch(console.error);
      }
    });
  });

  return { io, httpServer };
};
