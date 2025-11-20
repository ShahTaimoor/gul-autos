import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearTokenExpired, logout, setTokenExpired } from '@/redux/slices/auth/authSlice';
import { fetchCart } from '@/redux/slices/cart/cartSlice';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { user, isAuthenticated, tokenExpired } = useSelector((state) => state.auth);
  const { items: cartItems = [] } = useSelector((state) => state.cart);

  // Enhanced auth check for mobile devices
  const checkAuthentication = useCallback(async () => {
    if (user && isAuthenticated) {
      try {
        // Make a lightweight auth check
        const response = await fetch('/api/verify-token', {
          credentials: 'include',
          method: 'GET'
        });
        
        if (!response.ok) {
          dispatch(setTokenExpired());
        }
      } catch (error) {
        // Don't logout on network errors, just log
      }
    }
  }, [user, isAuthenticated, dispatch]);

  useEffect(() => {
    if (user && isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, user, isAuthenticated]);

  // Periodic auth check for mobile (every 5 minutes)
  useEffect(() => {
    if (user && isAuthenticated) {
      const interval = setInterval(checkAuthentication, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [user, isAuthenticated, checkAuthentication]);

  const publicPaths = ['/', '/products', '/all-products', '/search', '/success'];

  // Handle token expiration - stay on current page
  if (tokenExpired) {
    dispatch(clearTokenExpired());
    dispatch(logout());
    return children; // Allow access, user will see logged out state
  }

  // Check if user is not authenticated and trying to access protected route
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    // Redirect to home page instead of login
    return <Navigate to="/" replace />;
  }

  // Normal user trying to access admin route
  if (user?.role === 0 && pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // Empty cart, disallow checkout
  if (user && pathname === '/checkout' && cartItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
