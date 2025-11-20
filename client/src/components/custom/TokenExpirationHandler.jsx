import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { clearTokenExpired, logout, setTokenExpired } from '@/redux/slices/auth/authSlice';
import { useAuthDrawer } from '@/contexts/AuthDrawerContext';

const TokenExpirationHandler = () => {
  const dispatch = useDispatch();
  const { tokenExpired, user } = useSelector((state) => state.auth);
  const { openDrawer } = useAuthDrawer();

  // Enhanced redirect logic with mobile support
  const handleTokenExpiration = useCallback(() => {
    if (tokenExpired) {
      // Clear token expired state
      dispatch(clearTokenExpired());
      
      // Clear user data
      dispatch(logout());
      
      // Open auth drawer instead of redirecting
      openDrawer('login');
    }
  }, [tokenExpired, dispatch, openDrawer]);

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