import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: true, // Set to true for testing without backend
  
  login: (token: string, user: User) => {
    localStorage.setItem('authToken', token);
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  updateUser: (user: User) => {
    set({ user });
  },
}));
