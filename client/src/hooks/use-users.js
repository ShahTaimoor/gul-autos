import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { userService } from '@/services/userService';
import { updateUserRole } from '@/redux/slices/auth/authSlice';

/**
 * Custom hook for user management
 * Handles fetching users and updating roles
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState({});
  const dispatch = useDispatch();

  /**
   * Fetch all users
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      // Error handled silently - user will see empty state
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} newRole - New role value
   */
  const handleRoleChange = useCallback(async (userId, newRole) => {
    setUpdatingRoles((prev) => ({ ...prev, [userId]: true }));

    try {
      const result = await dispatch(
        updateUserRole({ userId, role: parseInt(newRole) })
      ).unwrap();

      if (result.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, role: parseInt(newRole) } : user
          )
        );
      }
    } catch (error) {
      // Role change error - user will see error from Redux action
    } finally {
      setUpdatingRoles((prev) => ({ ...prev, [userId]: false }));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    updatingRoles,
    fetchUsers,
    handleRoleChange,
  };
};

