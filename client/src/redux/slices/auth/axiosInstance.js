// src/features/auth/axiosInstance.js
import axios from 'axios';
import {store} from '../../store';
import { logout, setTokenExpired } from './authSlice';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL;

console.log('API_URL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    console.log('Axios interceptor error:', {
      status: error.response?.status,
      url: error.config?.url,
      retry: originalRequest._retry
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('Token expired - dispatching actions');

      // Clear auth state immediately
      store.dispatch(logout());
      store.dispatch(setTokenExpired());

      // Show toast notification
      if (typeof window !== 'undefined') {
        toast.error("Session expired. Please login again.");
      }

      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
