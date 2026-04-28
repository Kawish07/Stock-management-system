import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';

export interface UserProfile {
  name: string;
  email: string;
  full_name: string;
  user_image?: string;
}

export const authService = {
  /**
   * Authenticate with ERPNext using email + password (cookie-session flow).
   * ERPNext sets `sid` and `user_id` cookies on success.
   */
  async login(email: string, password: string): Promise<void> {
    try {
      await axiosInstance.post('/method/login', { usr: email, pwd: password });
    } catch (error) {
      const { errorCode } = handleApiError(error);
      if (errorCode === 401) throw new Error('Invalid email or password.');
      if (errorCode === 417) throw new Error('Account not found.');
      if (errorCode === 0) throw new Error('Cannot connect to server. Check your internet connection.');
      throw new Error('Login failed. Please try again.');
    }
  },

  /**
   * Invalidate the current ERPNext session server-side.
   */
  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/method/logout');
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /**
   * Fetch a fresh CSRF token from ERPNext and persist it to localStorage.
   * Returns the token string.
   */
  async getCSRFToken(): Promise<string> {
    try {
      const res = await axiosInstance.get('/method/frappe.auth.get_csrf_token');
      const token: string = res.data.csrf_token ?? res.data.message ?? '';
      if (typeof window !== 'undefined') {
        localStorage.setItem('csrf_token', token);
      }
      return token;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /**
   * Return the username of the currently logged-in user, or throw if guest.
   */
  async getLoggedUser(): Promise<string> {
    try {
      const res = await axiosInstance.get('/method/frappe.auth.get_logged_user');
      const user: string = res.data.message;
      if (!user || user === 'Guest') throw new Error('Not authenticated');
      return user;
    } catch (error) {
      if (error instanceof Error && error.message === 'Not authenticated') throw error;
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },

  /**
   * Fetch a User document's profile fields.
   */
  async getUserProfile(username: string): Promise<UserProfile> {
    try {
      const res = await axiosInstance.get(
        '/resource/User/' + encodeURIComponent(username),
        { params: { fields: JSON.stringify(['name', 'email', 'full_name', 'user_image']) } }
      );
      return res.data.data as UserProfile;
    } catch (error) {
      const { message } = handleApiError(error);
      throw new Error(message);
    }
  },
};

