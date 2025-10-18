// src/features/auth/axiosInstance.js
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Store reference will be set after store is created
let storeRef = null;

export const setStoreReference = (store) => {
  storeRef = store;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Check if it's a login POST request
    const isLoginRequest = error.config?.url?.includes('/login') && error.config?.method === 'post';
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If it's a login request, don't treat it as token expiry
      if (isLoginRequest) {
        return Promise.reject(error); // Pass the original error
      }

      // Clear auth state immediately if store is available
      if (storeRef) {
        const { logout, setTokenExpired } = require('./authSlice');
        storeRef.dispatch(logout());
        storeRef.dispatch(setTokenExpired());
      }

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
