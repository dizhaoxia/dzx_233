import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '../types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3202';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emit = <K extends keyof SocketEvents>(
  event: K,
  data: SocketEvents[K]
): void => {
  const s = getSocket();
  s.emit(event as string, data);
};

export const on = <K extends keyof SocketEvents>(
  event: K,
  callback: (data: SocketEvents[K]) => void
): (() => void) => {
  const s = getSocket();
  s.on(event as string, callback as any);
  return () => {
    s.off(event as string, callback as any);
  };
};

export const off = <K extends keyof SocketEvents>(
  event: K,
  callback: (data: SocketEvents[K]) => void
): void => {
  const s = getSocket();
  s.off(event as string, callback as any);
};
