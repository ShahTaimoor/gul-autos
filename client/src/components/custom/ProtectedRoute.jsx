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
  const { items: cartItems = [] } = useSelector((state) => state.cart); // agar cart empty ho toh default []

  // User login ho chuka ho toh cart fetch karo
  useEffect(() => {
    if (user && isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, user, isAuthenticated]);

  // Public routes (jahan login ke bina access allowed hai)
  const publicPaths = ['/login', '/signup'];

  // Public path check karne ke liye safe way
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // ✅ Token expire ho gaya ho toh login popup dikhao, lekin children render hone do
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

  // ✅ Agar user login nahi hai aur protected page par ja raha hai → login page par bhejo
  if (!isAuthenticated && !isPublicPath) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Agar admin user dobara /admin/login par jaye → dashboard par bhejo
  if (user?.role === 1 && pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // ✅ Agar normal user (role 0) admin route par jaye → home page bhejo
  if (user?.role === 0 && pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // ✅ Agar login ya signup page par user already authenticated ho → redirect karo homepage ya admin dashboard par
  if (isAuthenticated && isPublicPath) {
    return <Navigate to={user?.role === 1 ? '/admin/dashboard' : '/'} replace />;
  }

  // ✅ Agar checkout route par cart empty hai → home page bhejo
  if (user && pathname === '/checkout' && cartItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  // ✅ Agar sab kuch sahi hai, toh children render karo
  return children;
};

export default ProtectedRoute;
