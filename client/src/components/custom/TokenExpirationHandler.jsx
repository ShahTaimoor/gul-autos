import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { clearTokenExpired } from '@/redux/slices/auth/authSlice';

const TokenExpirationHandler = () => {
  const dispatch = useDispatch();
  const { tokenExpired } = useSelector((state) => state.auth);

  useEffect(() => {
    if (tokenExpired) {
      console.log('Token expired - redirecting to login page');
      dispatch(clearTokenExpired());
      // Use window.location.href for reliable redirect outside Router context
      window.location.href = '/login';
    }
  }, [tokenExpired, dispatch]);

  return null; // This component doesn't render anything
};

export default TokenExpirationHandler; 