// src/features/auth/authService.js
import axiosInstance from './axiosInstance';

const loginUser = async (userData) => {
  const response = await axiosInstance.post('/login', userData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

const updateProfile = async (data) => {
  const response = await axiosInstance.put('/update-profile', data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data.user;
};

const updateUserRole = async (userId, role) => {
  const response = await axiosInstance.put(`/update-user-role/${userId}`, { role }, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

const authService = { loginUser, updateProfile, updateUserRole };
export default authService;
