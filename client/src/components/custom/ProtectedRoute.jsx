import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearTokenExpired } from '@/redux/slices/auth/authSlice';
import { fetchCart } from '@/redux/slices/cart/cartSlice';
import LoginPopup from './LoginPopup';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { user, isAuthenticated, tokenExpired } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  useEffect(() => {
    if (user && isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, user, isAuthenticated]);

  const publicPaths = ['/login', '/signup'];

  // Handle token expiration - show popup instead of redirecting
  if (tokenExpired) {
    const handleCloseLoginPopup = () => {
      dispatch(clearTokenExpired());
    };

    return (
      <>
        {children}
        <LoginPopup isOpen={true} onClose={handleCloseLoginPopup} />
      </>
    );
  }

  // Check if user is not authenticated and trying to access protected route
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return <Navigate to="/login" replace />;
  }

  // Admin trying to revisit /admin/login
  if (user?.role === 1 && pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Normal user trying to access admin route
  if (user?.role === 0 && pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // Authenticated trying to access login/signup
  if (isAuthenticated && publicPaths.includes(pathname)) {
    return <Navigate to={user?.role === 1 ? '/admin/dashboard' : '/'} replace />;
  }

  // Empty cart, disallow checkout
  if (user && pathname === '/checkout' && cartItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute - rendering children');
  return children;
};

export default ProtectedRoute
