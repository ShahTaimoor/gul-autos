import axiosInstance from '@/redux/slices/auth/axiosInstance';

/**
 * User Service
 * All user-related API calls
 */
export const userService = {
  /**
   * Get all users
   * @returns {Promise<Array>} Array of users
   */
  getAllUsers: async () => {
    const response = await axiosInstance.get('/all-users');
    return Array.isArray(response.data) ? response.data : response.data?.users || [];
  },

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {number} role - New role (0: User, 1: Admin, 2: Super Admin)
   * @returns {Promise<Object>} Updated user data
   */
  updateUserRole: async (userId, role) => {
    const response = await axiosInstance.patch(`/users/${userId}/role`, { role });
    return response.data;
  },
};

