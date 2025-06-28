import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

import Login from '@/pages/Login';
import { clearTokenExpired } from '@/redux/slices/auth/authSlice';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { user, isAuthenticated, tokenExpired } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  const publicPaths = ['/login', '/signup'];

  
  if (tokenExpired) {
    return (
      <>
        <Login onClose={() => dispatch(clearTokenExpired())} />
        <div className="pointer-events-none blur-sm">{children}</div>
      </>
    );
  }

  // Not authenticated and trying to access protected routes
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return <Navigate to="/login?expired=true" replace state={{ from: pathname }} />;
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

  return children;
};

export default ProtectedRoute
