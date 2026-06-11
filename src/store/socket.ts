import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { useAuthStore } from './auth';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '');

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => set({ connected: true }));
    newSocket.on('disconnect', () => set({ connected: false }));

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },
}));
