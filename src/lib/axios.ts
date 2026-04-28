import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { handleApiError } from './errorHandler';

const axiosInstance = axios.create({
  baseURL: '/api/erpnext',
  withCredentials: true,
  timeout: 30000,
});

// ── Request interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    // NOTE: We do NOT set 'Expect' here because browsers block it.
    // The server-side route.ts handles connection logic if needed.

    // Only set Content-Type for requests that carry a body.
    if (config.method && !['get', 'head', 'delete'].includes(config.method.toLowerCase())) {
      config.headers['Content-Type'] = 'application/json';
    } else {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Prevent cascading redirects when multiple requests fail simultaneously.
let isRedirecting = false;

// ── Response interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const result = handleApiError(error);

    // 401 — session expired
    if (result.shouldLogout && !isRedirecting) {
      isRedirecting = true;
      toast.error('Session expired. Please login.');
      // Clear auth state without making another API call
      useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
      setTimeout(() => {
        window.location.href = '/login';
        isRedirecting = false;
      }, 1500);
      return Promise.reject(new Error(result.message));
    }

    // All other errors
    switch (result.errorCode) {
      case 403:
        toast.error("You don't have permission to do this.");
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 500:
        toast.error('Server error. Try again.');
        break;
      default:
        // Covers 400, 417, network errors, timeouts, etc.
        toast.error(result.message);
    }

    return Promise.reject(new Error(result.message));
  }
);

export default axiosInstance;