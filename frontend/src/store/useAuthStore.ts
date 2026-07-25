import { create } from 'zustand';
import { apiClient } from '../api/client';

export const Role = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  ADMIN: 'admin',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyId: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  registerCandidate: (data: any) => Promise<void>;
  registerRecruiter: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null, token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isLoading: false,

  setUser: (user, token) => {
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    set({ user, token });
  },

  login: async (email: string, password = 'Password123!') => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', accessToken);
      set({ user, token: accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  registerCandidate: async (data: any) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/register/candidate', data);
      const { user, accessToken } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', accessToken);
      set({ user, token: accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  registerRecruiter: async (data: any) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/register/recruiter', data);
      const { user, accessToken } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', accessToken);
      set({ user, token: accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await apiClient.get('/auth/me');
      set({ user: res.data });
    } catch (err) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));
