// src/features/auth/axiosInstance.js
import axios from 'axios';
import {store} from '../../store';
import { logout, setTokenExpired, refreshToken } from './authSlice';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://api.gultraders.com/api');

console.log('API_URL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log('Axios interceptor error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      retry: originalRequest._retry
    });

    // Check if it's a login POST request
    const isLoginRequest = error.config?.url?.includes('/login') && error.config?.method === 'post';
    const isRefreshRequest = error.config?.url?.includes('/refresh') && error.config?.method === 'post';
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If it's a login request, don't treat it as token expiry
      if (isLoginRequest) {
        console.log('Login failed - invalid credentials');
        return Promise.reject(error);
      }

      // If it's a refresh request that failed, logout immediately
      if (isRefreshRequest) {
        console.log('Refresh token failed - logging out');
        store.dispatch(logout());
        store.dispatch(setTokenExpired());
        return Promise.reject(error);
      }

      // Try to refresh the token
      try {
        console.log('Attempting to refresh token...');
        const refreshResult = await store.dispatch(refreshToken()).unwrap();
        
        if (refreshResult.success) {
          console.log('Token refreshed successfully, retrying original request');
          // Retry the original request with the new token
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
      }

      // If refresh failed, logout
      console.log('Token expired - dispatching actions');
      store.dispatch(logout());
      store.dispatch(setTokenExpired());

      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
