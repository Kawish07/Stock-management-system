import { create } from 'zustand';
import axiosInstance from '@/lib/axios';

interface User {
  name: string;
  email: string;
  full_name: string;
  user_image?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // start as loading so DashboardLayout waits for checkAuth()

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // 1. Authenticate
      await axiosInstance.post('/method/login', { usr: email, pwd: password });

      // 2. Fetch logged-in user profile
      const userRes = await axiosInstance.get('/method/frappe.auth.get_logged_user');
      const userName: string = userRes.data.message;
      const profileRes = await axiosInstance.get('/resource/User/' + encodeURIComponent(userName), {
        params: { fields: JSON.stringify(['name', 'email', 'full_name']) },
      });
      const profile = profileRes.data.data as User;

      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await axiosInstance.post('/method/logout');
    } catch {
      // proceed with local cleanup even if the API call fails
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  checkAuth: async () => {
    // Only show the loading spinner on initial load (not already authenticated).
    if (!useAuthStore.getState().isAuthenticated) {
      set({ isLoading: true });
    }
    try {
      const res = await axiosInstance.get('/method/frappe.auth.get_logged_user');
      const userName: string = res.data.message;
      if (!userName || userName === 'Guest') {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      // User is confirmed authenticated. Fetch their profile (best-effort).
      let profile: User = { name: userName, email: userName, full_name: userName };
      try {
        const profileRes = await axiosInstance.get('/resource/User/' + encodeURIComponent(userName), {
          params: { fields: JSON.stringify(['name', 'email', 'full_name']) },
        });
        if (profileRes.data.data) {
          profile = profileRes.data.data as User;
        }
      } catch {
        // Profile fetch failed — continue with basic info, still authenticated.
      }
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

