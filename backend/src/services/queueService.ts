import * as SessionModel from '../models/Session.js';
import type { QueueItem } from '../types/index.js';

const queue: Map<number, QueueItem> = new Map();

export const addToQueue = (sessionId: number, visitorId: string): number => {
  const item: QueueItem = {
    sessionId,
    visitorId,
    createdAt: new Date()
  };
  queue.set(sessionId, item);
  return getQueuePosition(sessionId);
};

export const removeFromQueue = (sessionId: number): void => {
  queue.delete(sessionId);
};

export const getQueuePosition = (sessionId: number): number => {
  const sortedSessions = Array.from(queue.values())
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  return sortedSessions.findIndex(item => item.sessionId === sessionId) + 1;
};

export const getNextInQueue = (): QueueItem | null => {
  const sortedSessions = Array.from(queue.values())
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  return sortedSessions[0] || null;
};

export const getQueueSize = (): number => {
  return queue.size;
};

export const syncQueueFromDB = async (): Promise<void> => {
  queue.clear();
  const waitingSessions = await SessionModel.findWaitingSessions();
  
  for (const session of waitingSessions) {
    queue.set(session.id, {
      sessionId: session.id,
      visitorId: session.visitorId,
      createdAt: session.createdAt
    });
  }
};
