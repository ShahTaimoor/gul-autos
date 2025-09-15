import { useSelector, useDispatch } from 'react-redux';
import { clearTokenExpired } from '@/redux/slices/auth/authSlice';

const TokenExpirationHandler = () => {
  const dispatch = useDispatch();
  const { tokenExpired } = useSelector((state) => state.auth);

  // Just clear the token expired state
  // The actual navigation is handled in ProtectedRoute
  if (tokenExpired) {
    dispatch(clearTokenExpired());
  }

  return null;
};

export default TokenExpirationHandler; 