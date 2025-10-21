import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { clearTokenExpired, logout, setTokenExpired } from '@/redux/slices/auth/authSlice';

const TokenExpirationHandler = () => {
  const dispatch = useDispatch();
  const { tokenExpired, user } = useSelector((state) => state.auth);

  // Enhanced redirect logic with mobile support
  const handleTokenExpiration = useCallback(() => {
    if (tokenExpired) {
      // Clear token expired state
      dispatch(clearTokenExpired());
      
      // Clear user data
      dispatch(logout());
      
      // Get current path for redirect after login
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin');
      
      // Redirect to appropriate login page using window.location
      const redirectPath = isAdminRoute ? '/admin/login' : '/login';
      
      // Add expired parameter to show appropriate message
      const redirectUrl = `${redirectPath}?expired=true&redirect=${encodeURIComponent(currentPath)}`;
      
      // Use window.location for redirect (works outside Router context)
      window.location.href = redirectUrl;
    }
  }, [tokenExpired, dispatch]);

  useEffect(() => {
    handleTokenExpiration();
  }, [handleTokenExpiration]);

  // Handle page visibility change for mobile (when app comes back to foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Check if user is still authenticated when app becomes visible
        // This helps with mobile browser tab switching
        const checkAuth = async () => {
          try {
            const response = await fetch('/api/verify-token', {
              credentials: 'include',
              method: 'GET'
            });
            
            if (!response.ok) {
              dispatch(setTokenExpired());
            }
          } catch (error) {
            console.log('Auth check failed:', error);
            // Don't automatically logout on network errors
          }
        };
        
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, dispatch]);

  return null;
};

export default TokenExpirationHandler; 