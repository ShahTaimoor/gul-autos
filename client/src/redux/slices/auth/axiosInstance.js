// src/features/auth/axiosInstance.js
import axios from 'axios';
import {store} from '../../store';
import { logout, setTokenExpired } from './authSlice';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear auth state immediately
      store.dispatch(logout());
      store.dispatch(setTokenExpired());

      // Also force navigation to login (inside a browser environment only)
      window.location.href = '/login?expired=true';

       // Show toast only if we're in a browser environment
      if (typeof window !== 'undefined') {
        toast.error("Session expired. Please login again.");
        window.location.href = '/login?expired=true';
      }

      return Promise.reject(new Error('Session expired. Redirecting...'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
