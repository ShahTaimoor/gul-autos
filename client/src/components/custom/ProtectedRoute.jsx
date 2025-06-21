import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  const publicPaths = ['/login', '/signup'];

  // Not logged in → redirect to login page (if not on publicPaths)
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return <Navigate to="/login?expired=true" replace state={{ from: pathname }} />;
  }

  // Admin trying to revisit admin login → Redirect to admin dashboard
  if (user && user.role === 1 && pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Admin trying to visit the homepage → Redirect to admin dashboard
  if (user && user.role === 1 && pathname === '/') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Normal user trying to access admin routes → Redirect to homepage
  if (user && user.role === 0 && pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // Logged-in users visiting login/signup pages → Redirect based on user role
  if (isAuthenticated && publicPaths.includes(pathname)) {
    // Redirect to admin dashboard if the user is an admin (role 1)
    if (user && user.role === 1) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Redirect to homepage if the user is a normal user (role 0)
    if (user && user.role === 0) {
      return <Navigate to="/" replace />;
    }
  }

  // Empty cart → No checkout for logged-in users
  if (user && pathname === '/checkout' && cartItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
