import * as AdminModel from '../models/Admin.js';
import * as SessionModel from '../models/Session.js';
import { removeFromQueue } from './queueService.js';
import type { Admin, Session } from '../types/index.js';

let lastAssignedIndex = -1;

export const getAvailableAdmins = async (): Promise<Admin[]> => {
  return await AdminModel.findAvailableAdmins();
};

export const assignSession = async (session: Session): Promise<Admin | null> => {
  const availableAdmins = await getAvailableAdmins();
  
  if (availableAdmins.length === 0) {
    return null;
  }

  lastAssignedIndex = (lastAssignedIndex + 1) % availableAdmins.length;
  const assignedAdmin = availableAdmins[lastAssignedIndex];

  await SessionModel.assignAdmin(session.id, assignedAdmin.id);
  await AdminModel.updateLastOnline(assignedAdmin.id);

  return assignedAdmin;
};

export const processWaitingSessions = async (io: any): Promise<void> => {
  const waitingSessions = await SessionModel.findWaitingSessions();
  const availableAdmins = await getAvailableAdmins();

  if (availableAdmins.length === 0 || waitingSessions.length === 0) {
    return;
  }

  for (const session of waitingSessions) {
    const admin = await assignSession(session);
    if (admin) {
      removeFromQueue(session.id);
      const updatedSession = await SessionModel.findById(session.id);
      
      io.to(`visitor:${session.visitorId}`).emit('session:assigned', {
        session: updatedSession,
        admin: { id: admin.id, username: admin.username }
      });

      io.to(`admin:${admin.id}`).emit('session:new', { session: updatedSession });
    }
  }
};

export const resetAssignmentCounter = (): void => {
  lastAssignedIndex = -1;
};
