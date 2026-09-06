import { io, Socket } from 'socket.io-client';
import { socketUrl } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (!socket) {
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
