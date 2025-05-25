import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  const publicPaths = ['/login', '/signup'];

  // Not logged in → redirect
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return <Navigate to="/login?expired=true" replace state={{ from: pathname }} />;
  }

  // Admin trying to revisit admin login
  if (user && user.role === 1 && pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Normal user trying to access admin
  if (user && user.role === 0 && pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // Logged-in users visiting login/signup
  if (isAuthenticated && publicPaths.includes(pathname)) {
    return <Navigate to="/" replace />;
  }

  // Empty cart → no checkout
  if (user && pathname === '/checkout' && cartItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
