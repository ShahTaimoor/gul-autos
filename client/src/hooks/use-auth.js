import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { logout } from '@/redux/slices/auth/authSlice';

/**
 * Clear cookies helper (shared utility)
 */
const clearCookies = () => {
  const cookies = ['accessToken', 'refreshToken'];
  const domains = [window.location.hostname, 'localhost', '127.0.0.1'];
  const paths = ['/', '/api', '/admin'];

  cookies.forEach((cookieName) => {
    domains.forEach((domain) => {
      paths.forEach((path) => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${domain};`;
        document.cookie = `${cookieName}=; max-age=0; path=${path};`;
        document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=${domain};`;
        document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=.${domain};`;
      });
    });
  });
};

/**
 * Verify token (can be used outside Router context)
 * @returns {Promise<boolean>} True if token is valid
 */
export const verifyToken = async () => {
  try {
    const result = await authService.verifyToken();
    return result.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Custom hook for authentication actions (requires Router context)
 * Handles logout with navigation
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    // Always clear local data first
    localStorage.removeItem('user');
    dispatch(logout());
    clearCookies();

    try {
      await authService.logout();
      clearCookies();
    } catch (error) {
      // Clear cookies even if API fails
      clearCookies();
    } finally {
      navigate('/');
    }
  }, [dispatch, navigate]);

  return {
    handleLogout,
    verifyToken,
    clearCookies,
  };
};

