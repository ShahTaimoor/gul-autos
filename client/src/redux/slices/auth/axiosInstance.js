import axios from 'axios';
import { store } from '../../store';
import { logout } from './authSlice';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const refreshToken = async () => {
  const res = await axios.get(`${API_URL}/refresh-token`, { withCredentials: true });
  return res.data.token;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshToken(); 
        return axiosInstance(originalRequest); 
      } catch (err) {
        store.dispatch(logout());
        window.location.href = '/login?expired=true';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;

