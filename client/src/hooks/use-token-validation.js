import { useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { validateToken, setTokenExpired, refreshToken } from '@/redux/slices/auth/authSlice';

/**
 * Hook for proactive token validation
 * Validates token on app start and periodically
 */
export function useTokenValidation() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isInitialized = useRef(false);

  const validateUserToken = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      await dispatch(validateToken()).unwrap();
      console.log('Token validation successful');
    } catch (error) {
      console.log('Token validation failed:', error);
      dispatch(setTokenExpired());
      // User will be automatically redirected to login page
    }
  }, [dispatch, isAuthenticated, user]);

  // Validate token on mount only once
  useEffect(() => {
    if (isAuthenticated && user && !isInitialized.current) {
      isInitialized.current = true;
      validateUserToken();
    }
  }, [isAuthenticated, user]); // Removed validateUserToken from deps

  // Periodic token validation (every 10 minutes)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const interval = setInterval(() => {
      validateUserToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, user]); // Removed validateUserToken from deps

  return { validateUserToken };
}

/**
 * Hook for automatic token refresh
 * Attempts to refresh token before it expires
 */
export function useTokenRefresh() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isInitialized = useRef(false);

  const refreshUserToken = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      await dispatch(refreshToken()).unwrap();
      console.log('Token refresh successful');
    } catch (error) {
      console.log('Token refresh failed:', error);
      dispatch(setTokenExpired());
      // User will be automatically redirected to login page
    }
  }, [dispatch, isAuthenticated, user]);

  // Refresh token every 20 minutes (tokens expire in 24 hours)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const interval = setInterval(() => {
      refreshUserToken();
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, user]); // Removed refreshUserToken from deps

  return { refreshUserToken };
}
