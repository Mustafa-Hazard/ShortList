import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../api/client';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, any>;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  socket: Socket | null;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,

  connectSocket: (userId: string) => {
    if (get().socket) return;
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3000', {
      auth: { token },
      query: { userId },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join', { userId });
    });

    socket.on('notification', (newNotif: any) => {
      const item: NotificationItem = {
        id: Math.random().toString(),
        userId,
        type: newNotif.type,
        payload: newNotif.payload,
        read: false,
        createdAt: newNotif.timestamp || new Date().toISOString(),
      };
      set((state) => ({
        notifications: [item, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await apiClient.get('/notifications/me');
      const items: NotificationItem[] = res.data;
      const unreadCount = items.filter((n) => !n.read).length;
      set({ notifications: items, unreadCount });
    } catch (err) {
      // Ignore auth errors if not logged in
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        );
        const unreadCount = notifications.filter((n) => !n.read).length;
        return { notifications, unreadCount };
      });
    } catch (err) {
      // Degrade gracefully
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      // Degrade gracefully
    }
  },
}));
