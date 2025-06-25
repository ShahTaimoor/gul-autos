import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  const publicPaths = ['/login', '/signup'];

  // Not authenticated and trying to access protected routes
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return <Navigate to="/login?expired=true" replace state={{ from: pathname }} />;
  }

  // Admin trying to revisit /admin/login → redirect to admin dashboard
  if (user?.role === 1 && pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // 🚫 Normal user trying to access any admin route
  if (user?.role === 0 && pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // Authenticated user trying to access login/signup → redirect accordingly
  if (isAuthenticated && publicPaths.includes(pathname)) {
    return <Navigate to={user?.role === 1 ? '/admin/dashboard' : '/'} replace />;
  }

  // Empty cart → disallow access to checkout
  if (user && pathname === '/checkout' && cartItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
